from django.shortcuts import render
from django.http import JsonResponse, HttpResponseBadRequest
from django.views.decorators.http import require_POST
from django.views.decorators.csrf import ensure_csrf_cookie
from django.contrib.auth.decorators import login_required
from django.core.files.base import ContentFile
from django.utils import timezone
import json
import base64
import html
import re
import urllib.request
import binascii
import os
import shlex
import subprocess
import tempfile
import zipfile
from pathlib import Path
from xml.etree import ElementTree
from urllib.parse import urlparse


MAX_AUDIO_BYTES = 20 * 1024 * 1024
MAX_SYNC_SESSIONS = 100
MAX_SYNC_SAMPLES = 20
MAX_SCORE_BYTES = 15 * 1024 * 1024
ALLOWED_AUDIO_TYPES = {
    'audio/mpeg', 'audio/mp3', 'audio/mp4', 'audio/ogg', 'audio/wav',
    'audio/x-wav', 'audio/webm', 'application/octet-stream',
}


def _validate_audio_upload(upload):
    if upload.size > MAX_AUDIO_BYTES:
        return HttpResponseBadRequest('Audio exceeds the 20 MB limit.')
    content_type = (getattr(upload, 'content_type', '') or '').lower()
    if content_type and content_type not in ALLOWED_AUDIO_TYPES:
        return HttpResponseBadRequest('Unsupported audio format.')
    return None


def _musicxml_bytes(path):
    if path.suffix.lower() != '.mxl':
        return path.read_bytes()
    with zipfile.ZipFile(path) as archive:
        candidates = [
            name for name in archive.namelist()
            if name.lower().endswith(('.musicxml', '.xml')) and not name.startswith('META-INF/')
        ]
        if not candidates:
            raise ValueError('MusicXML file not found inside MXL.')
        if archive.getinfo(candidates[0]).file_size > MAX_SCORE_BYTES:
            raise ValueError('The expanded MusicXML exceeds the 15 MB limit.')
        return archive.read(candidates[0])


def _parse_musicxml_score(xml_bytes):
    root = ElementTree.fromstring(xml_bytes)
    for element in root.iter():
        if '}' in element.tag:
            element.tag = element.tag.rsplit('}', 1)[1]

    part = root.find('./part')
    if part is None:
        raise ValueError('No musical part was found.')

    title = root.findtext('./work/work-title') or root.findtext('./movement-title') or 'Partitura importada'
    divisions = 1
    bpm = 60
    meter = '4/4'
    notes = []
    beats = []
    selected_voice = None

    for measure in part.findall('./measure'):
        divisions_text = measure.findtext('./attributes/divisions')
        if divisions_text:
            divisions = max(1, int(float(divisions_text)))
        beat_count = measure.findtext('./attributes/time/beats')
        beat_type = measure.findtext('./attributes/time/beat-type')
        if beat_count and beat_type:
            meter = f'{beat_count}/{beat_type}'
        sound = measure.find('./direction/sound[@tempo]')
        if sound is not None:
            bpm = max(30, min(240, round(float(sound.attrib['tempo']))))

        for note in measure.findall('./note'):
            if note.find('./grace') is not None or note.find('./chord') is not None:
                continue
            voice = note.findtext('./voice') or '1'
            if selected_voice is None and note.find('./rest') is None:
                selected_voice = voice
            if voice != (selected_voice or voice) or note.find('./rest') is not None:
                continue
            step = note.findtext('./pitch/step')
            octave = note.findtext('./pitch/octave')
            if not step or octave is None:
                continue
            alter = int(float(note.findtext('./pitch/alter') or 0))
            accidental = '#' * alter if alter > 0 else 'b' * abs(alter)
            duration = max(0.125, float(note.findtext('./duration') or divisions) / divisions)
            notes.append(f'{step.upper()}{accidental}{octave}')
            beats.append(duration)
            if len(notes) >= 256:
                break
        if len(notes) >= 256:
            break

    if not notes:
        raise ValueError('No playable melody was recognized in the first part.')
    return {'title': title, 'notes': notes, 'beats': beats, 'bpm': bpm, 'meter': meter}


def _convert_pdf_with_audiveris(pdf_path, output_dir):
    command = shlex.split(os.getenv('AUDIVERIS_COMMAND', 'audiveris'))
    try:
        result = subprocess.run(
            [*command, '-batch', '-export', '-output', str(output_dir), '--', str(pdf_path)],
            check=False,
            capture_output=True,
            text=True,
            timeout=180,
            env={**os.environ, 'JAVA_TOOL_OPTIONS': os.getenv('JAVA_TOOL_OPTIONS', '-Xmx3g')},
        )
    except FileNotFoundError as exc:
        raise RuntimeError('The OMR engine is not installed on the server.') from exc
    except subprocess.TimeoutExpired as exc:
        raise RuntimeError('PDF recognition exceeded the three-minute limit.') from exc
    candidates = list(output_dir.rglob('*.mxl')) + list(output_dir.rglob('*.musicxml')) + list(output_dir.rglob('*.xml'))
    if result.returncode != 0 or not candidates:
        detail = (result.stderr or result.stdout or '').strip()[-600:]
        raise RuntimeError(f'OMR could not recognize this score. {detail}'.strip())
    return candidates[0]


@ensure_csrf_cookie
def index(request):
    return render(request, "app/index.html")


@login_required
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

    loc = Location.objects.create(user=request.user, latitude=lat, longitude=lon, accuracy=acc)
    return JsonResponse({'status': 'ok', 'id': loc.id})


@login_required
def locations_list(request):
    if not request.user.is_staff:
        return render(request, 'app/forbidden.html', status=403)
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
def import_score(request):
    score = request.FILES.get('score')
    if not score:
        return HttpResponseBadRequest('Choose a PDF, MusicXML, XML, or MXL file.')
    if score.size > MAX_SCORE_BYTES:
        return HttpResponseBadRequest('The score exceeds the 15 MB limit.')
    extension = Path(score.name).suffix.lower()
    if extension not in {'.pdf', '.musicxml', '.xml', '.mxl'}:
        return HttpResponseBadRequest('Unsupported score format.')

    try:
        with tempfile.TemporaryDirectory(prefix='score-omr-') as temp_name:
            temp_dir = Path(temp_name)
            input_path = temp_dir / f'input{extension}'
            with input_path.open('wb') as destination:
                for chunk in score.chunks():
                    destination.write(chunk)
            musicxml_path = _convert_pdf_with_audiveris(input_path, temp_dir) if extension == '.pdf' else input_path
            parsed = _parse_musicxml_score(_musicxml_bytes(musicxml_path))
    except (ValueError, ElementTree.ParseError, zipfile.BadZipFile) as exc:
        return JsonResponse({'status': 'error', 'message': str(exc)}, status=422)
    except RuntimeError as exc:
        return JsonResponse({'status': 'error', 'message': str(exc)}, status=503)

    return JsonResponse({'status': 'ok', **parsed})


@login_required
@require_POST
def upload_audio(request):
    # Accepts multipart/form-data with file field 'audio'
    f = request.FILES.get('audio')
    if not f:
        return HttpResponseBadRequest('No audio file')
    validation_error = _validate_audio_upload(f)
    if validation_error:
        return validation_error
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
    validation_error = _validate_audio_upload(f)
    if validation_error:
        return validation_error
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

    sessions = payload.get('sessions', [])
    samples = payload.get('samples', [])
    if not isinstance(sessions, list) or not isinstance(samples, list):
        return HttpResponseBadRequest('Sessions and samples must be lists.')
    if len(sessions) > MAX_SYNC_SESSIONS or len(samples) > MAX_SYNC_SAMPLES:
        return HttpResponseBadRequest('Sync batch is too large.')

    for session_payload in sessions:
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

    for sample_payload in samples:
        client_id = str(sample_payload.get('id') or '')[:64]
        if not client_id:
            continue
        if LabeledSample.objects.filter(user=request.user, client_id=client_id).exists():
            synced_samples += 1
            continue
        audio_b64 = sample_payload.get('audio_b64')
        if not audio_b64:
            continue
        labels = sample_payload.get('labels', {})
        features = sample_payload.get('features', {})
        exercise = sample_payload.get('exercise', '')
        if not isinstance(audio_b64, str) or len(audio_b64) > ((MAX_AUDIO_BYTES * 4 // 3) + 8):
            return HttpResponseBadRequest('Audio exceeds the 20 MB limit.')
        try:
            raw = base64.b64decode(audio_b64, validate=True)
        except (ValueError, binascii.Error):
            return HttpResponseBadRequest('Invalid base64 audio.')
        if len(raw) > MAX_AUDIO_BYTES:
            return HttpResponseBadRequest('Audio exceeds the 20 MB limit.')
        rec = Recording(user=request.user)
        rec.file.save(f"{client_id}.webm", ContentFile(raw), save=True)
        LabeledSample.objects.create(
            user=request.user, client_id=client_id, recording=rec,
            exercise=exercise, labels=labels, features=features,
        )
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
