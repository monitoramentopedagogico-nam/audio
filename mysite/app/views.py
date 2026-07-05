from django.shortcuts import render
from django.http import JsonResponse, HttpResponseBadRequest
from django.views.decorators.http import require_POST
from django.views.decorators.csrf import ensure_csrf_cookie
from django.contrib.auth.decorators import login_required
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from django.utils import timezone
import json
import base64
import html
import re
import urllib.request
from urllib.parse import urlparse


@ensure_csrf_cookie
def index(request):
    return render(request, "app/index.html")


@require_POST
def location_update(request):
    try:
        data = json.loads(request.body)
        lat = float(data.get('latitude'))
        lon = float(data.get('longitude'))
        acc = data.get('accuracy')
        if acc is not None:
            acc = float(acc)
    except Exception:
        return HttpResponseBadRequest('Invalid payload')

    from .models import Location

    loc = Location.objects.create(latitude=lat, longitude=lon, accuracy=acc)
    return JsonResponse({'status': 'ok', 'id': loc.id})


def locations_list(request):
    from .models import Location
    qs = Location.objects.order_by('-recorded_at')[:200]
    return render(request, 'app/locations.html', {'locations': qs})


@login_required
@ensure_csrf_cookie
def audio(request):
    return render(request, 'app/audio.html')


def _strip_html(value):
    value = re.sub(r'<br\s*/?>', '\n', value, flags=re.I)
    value = re.sub(r'</p\s*>', '\n', value, flags=re.I)
    value = re.sub(r'<[^>]+>', '', value)
    value = html.unescape(value)
    value = value.replace('\xa0', ' ')
    value = re.sub(r'\n{3,}', '\n\n', value)
    return value.strip()


def _extract_cifra_text(page_html):
    pre_match = re.search(r'<pre[^>]*>(.*?)</pre>', page_html, flags=re.I | re.S)
    if pre_match:
        return _strip_html(pre_match.group(1))

    js_match = re.search(r'"cifra"\s*:\s*"((?:\\.|[^"\\])*)"', page_html, flags=re.S)
    if js_match:
        try:
            return json.loads(f'"{js_match.group(1)}"').strip()
        except Exception:
            pass

    article_match = re.search(r'<article[^>]*>(.*?)</article>', page_html, flags=re.I | re.S)
    if article_match:
        return _strip_html(article_match.group(1))

    return ''


def _extract_cifra_melodica_text(page_html):
    if 'song-login-gate' in page_html:
        return ''

    candidates = []
    for pattern in (
        r'<div[^>]+id=["\']versaoAtual["\'][^>]*>(.*?)</div>\s*</div>',
        r'<div[^>]+class=["\'][^"\']*(?:musica|cifra|nota)[^"\']*["\'][^>]*>(.*?)</div>',
        r'<main[^>]*>(.*?)</main>',
    ):
        for match in re.finditer(pattern, page_html, flags=re.I | re.S):
            text = _strip_html(match.group(1))
            if text and len(text) > 80:
                candidates.append(text)

    if candidates:
        return max(candidates, key=len)
    return ''


@login_required
@require_POST
def fetch_chord_sheet(request):
    try:
        payload = json.loads(request.body.decode('utf-8'))
    except Exception:
        return HttpResponseBadRequest('Invalid JSON payload')

    url = (payload.get('url') or '').strip()
    parsed = urlparse(url)
    allowed_hosts = {'www.cifraclub.com.br', 'cifraclub.com.br', 'ciframelodica.com.br', 'www.ciframelodica.com.br'}
    if parsed.scheme not in {'http', 'https'} or parsed.netloc.lower() not in allowed_hosts:
        return HttpResponseBadRequest('Use um link do Cifra Club ou Cifra Melodica.')

    request_obj = urllib.request.Request(
        url,
        headers={
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept-Language': 'pt-BR,pt;q=0.9',
        },
    )
    try:
        with urllib.request.urlopen(request_obj, timeout=15) as response:
            raw = response.read(2_000_000)
    except Exception:
        return JsonResponse({'status': 'error', 'message': 'Nao consegui acessar esse link agora.'}, status=502)

    page_html = raw.decode('utf-8', errors='ignore')
    title_match = re.search(r'<title[^>]*>(.*?)</title>', page_html, flags=re.I | re.S)
    title = _strip_html(title_match.group(1)) if title_match else 'Cifra importada'
    is_cifra_melodica = parsed.netloc.lower() in {'ciframelodica.com.br', 'www.ciframelodica.com.br'}
    cifra = _extract_cifra_melodica_text(page_html) if is_cifra_melodica else _extract_cifra_text(page_html)
    if is_cifra_melodica and not cifra and 'song-login-gate' in page_html:
        return JsonResponse({
            'status': 'locked',
            'title': title,
            'message': 'A Cifra Melodica exige login para mostrar as notas completas dessa musica. Entre no site, copie as notas e cole no campo Cifra melodica por letra.',
        })
    if not cifra:
        return JsonResponse({'status': 'error', 'message': 'Nao encontrei a cifra nessa pagina.'}, status=422)

    return JsonResponse({'status': 'ok', 'title': title, 'content': cifra, 'source': 'cifra_melodica' if is_cifra_melodica else 'cifra_club'})


@login_required
@require_POST
def upload_audio(request):
    # Accepts multipart/form-data with file field 'audio'
    f = request.FILES.get('audio')
    if not f:
        return HttpResponseBadRequest('No audio file')
    from .models import Recording
    rec = Recording(user=request.user)
    rec.file.save(f.name, f, save=True)
    return JsonResponse({'status':'ok','id':rec.id,'path':rec.file.url})


@login_required
def recordings_list(request):
    from .models import Recording
    qs = Recording.objects.filter(user=request.user).order_by('-created_at')
    return render(request, 'app/recordings.html', {'recordings': qs})


@login_required
@require_POST
def upload_sample(request):
    # Accept multipart/form-data with 'audio' blob and 'labels' JSON and optional 'features' JSON and 'exercise'
    f = request.FILES.get('audio')
    labels = request.POST.get('labels')
    features = request.POST.get('features')
    exercise = request.POST.get('exercise') or ''
    if not f or not labels:
        return HttpResponseBadRequest('Missing audio or labels')
    try:
        labels_json = json.loads(labels)
    except Exception:
        labels_json = {}
    try:
        features_json = json.loads(features) if features else {}
    except Exception:
        features_json = {}
    from .models import Recording, LabeledSample
    rec = Recording(user=request.user)
    rec.file.save(f.name, f, save=True)
    sample = LabeledSample.objects.create(user=request.user, recording=rec, exercise=exercise, labels=labels_json, features=features_json)
    return JsonResponse({'status':'ok','id': sample.id, 'recording_id': rec.id, 'path': rec.file.url})


@login_required
@require_POST
def sync_local_data(request):
    try:
        payload = json.loads(request.body.decode('utf-8'))
    except Exception:
        return HttpResponseBadRequest('Invalid JSON payload')

    from .models import Recording, LabeledSample, PracticeSession

    synced_sessions = 0
    synced_samples = 0

    for session_payload in payload.get('sessions', []):
        client_id = session_payload.get('client_id') or ''
        if not client_id:
            continue
        obj, created = PracticeSession.objects.get_or_create(
            user=request.user,
            client_id=client_id,
            defaults={
                'exercise': session_payload.get('exercise', ''),
                'session_data': session_payload,
                'synced_at': timezone.now(),
            },
        )
        if not created:
            obj.exercise = session_payload.get('exercise', obj.exercise)
            obj.session_data = session_payload
            obj.synced_at = timezone.now()
            obj.save()
        synced_sessions += 1

    for sample_payload in payload.get('samples', []):
        audio_b64 = sample_payload.get('audio_b64')
        if not audio_b64:
            continue
        labels = sample_payload.get('labels', {})
        features = sample_payload.get('features', {})
        exercise = sample_payload.get('exercise', '')
        raw = base64.b64decode(audio_b64)
        rec = Recording(user=request.user)
        rec.file.save(f"{sample_payload.get('id', 'sample')}.webm", ContentFile(raw), save=True)
        LabeledSample.objects.create(user=request.user, recording=rec, exercise=exercise, labels=labels, features=features)
        synced_samples += 1

    return JsonResponse({'status': 'ok', 'synced_sessions': synced_sessions, 'synced_samples': synced_samples})


@login_required
def student_dashboard(request):
    from .models import LabeledSample
    qs = LabeledSample.objects.filter(user=request.user).order_by('-created_at')[:200]
    return render(request, 'app/dashboard_student.html', {'samples': qs})


@login_required
def teacher_dashboard(request):
    if not request.user.is_staff:
        return render(request, 'app/forbidden.html', status=403)
    from .models import LabeledSample
    qs = LabeledSample.objects.select_related('user','recording').order_by('-created_at')[:1000]
    return render(request, 'app/dashboard_teacher.html', {'samples': qs})
