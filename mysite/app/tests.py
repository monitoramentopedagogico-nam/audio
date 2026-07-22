import base64
import json

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from django.urls import reverse

from .models import LabeledSample, Location, PracticeSession, SavedScore
from .views import MAX_AUDIO_BYTES


class PrivacyTests(TestCase):
    def setUp(self):
        user_model = get_user_model()
        self.user = user_model.objects.create_user(username='student', password='test-pass-123')
        self.staff = user_model.objects.create_user(
            username='teacher', password='test-pass-123', is_staff=True
        )

    def test_location_update_requires_login(self):
        response = self.client.post(
            reverse('location_update'),
            data=json.dumps({'latitude': -23.5, 'longitude': -46.6}),
            content_type='application/json',
        )
        self.assertEqual(response.status_code, 302)

    def test_location_is_associated_with_authenticated_user(self):
        self.client.force_login(self.user)
        response = self.client.post(
            reverse('location_update'),
            data=json.dumps({'latitude': -23.5, 'longitude': -46.6}),
            content_type='application/json',
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(Location.objects.get().user, self.user)

    def test_location_list_is_restricted_to_staff(self):
        self.client.force_login(self.user)
        self.assertEqual(self.client.get(reverse('locations_list')).status_code, 403)
        self.client.force_login(self.staff)
        self.assertEqual(self.client.get(reverse('locations_list')).status_code, 200)

    def test_audio_page_exposes_the_four_main_learning_areas(self):
        self.client.force_login(self.user)
        response = self.client.get(reverse('audio'))
        self.assertIn("script-src 'self'", response.headers['Content-Security-Policy'])
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, '/static/app/audio.css')
        self.assertContains(response, '/static/app/audio-timing.js')
        self.assertContains(response, '/static/app/audio.js')
        self.assertContains(response, 'id="saveTranscriptionPdfBtn"')
        for stage in ('practice', 'repertoire', 'progress', 'profile'):
            self.assertContains(response, f'data-stage-target="{stage}"')


class UploadSecurityTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username='student', password='test-pass-123'
        )
        self.client.force_login(self.user)

    def test_rejects_oversized_audio(self):
        upload = SimpleUploadedFile(
            'large.webm', b'0' * (MAX_AUDIO_BYTES + 1), content_type='audio/webm'
        )
        response = self.client.post(reverse('upload_audio'), {'audio': upload})
        self.assertEqual(response.status_code, 400)

    def test_rejects_non_audio_upload(self):
        upload = SimpleUploadedFile('payload.html', b'<script></script>', content_type='text/html')
        response = self.client.post(reverse('upload_audio'), {'audio': upload})
        self.assertEqual(response.status_code, 400)

    def test_sync_is_idempotent_for_sessions_and_samples(self):
        payload = {
            'sessions': [{'client_id': 'session-1', 'exercise': 'long-tone'}],
            'samples': [{
                'id': 'sample-1',
                'exercise': 'long-tone',
                'labels': {'note': 'G4'},
                'features': {},
                'audio_b64': base64.b64encode(b'webm-audio').decode('ascii'),
            }],
        }
        for _ in range(2):
            response = self.client.post(
                reverse('sync_local_data'),
                data=json.dumps(payload),
                content_type='application/json',
            )
            self.assertEqual(response.status_code, 200)

        self.assertEqual(PracticeSession.objects.count(), 1)
        self.assertEqual(LabeledSample.objects.count(), 1)

    def test_sync_rejects_invalid_base64(self):
        payload = {
            'sessions': [],
            'samples': [{'id': 'sample-1', 'audio_b64': 'not base64!'}],
        }
        response = self.client.post(
            reverse('sync_local_data'),
            data=json.dumps(payload),
            content_type='application/json',
        )
        self.assertEqual(response.status_code, 400)

    def test_imports_musicxml_as_playable_notes(self):
        xml = b'''<?xml version="1.0" encoding="UTF-8"?>
        <score-partwise version="4.0">
          <work><work-title>Teste de leitura</work-title></work>
          <part-list><score-part id="P1"><part-name>Sax</part-name></score-part></part-list>
          <part id="P1"><measure number="1">
            <attributes><divisions>2</divisions><time><beats>4</beats><beat-type>4</beat-type></time></attributes>
            <direction><sound tempo="72"/></direction>
            <note><pitch><step>G</step><octave>4</octave></pitch><duration>2</duration><voice>1</voice></note>
            <note><pitch><step>A</step><alter>1</alter><octave>4</octave></pitch><duration>4</duration><voice>1</voice></note>
          </measure></part>
        </score-partwise>'''
        score = SimpleUploadedFile('score.musicxml', xml, content_type='application/vnd.recordare.musicxml+xml')
        response = self.client.post(reverse('import_score'), {'score': score})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['notes'], ['G4', 'A#4'])
        self.assertEqual(response.json()['beats'], [1.0, 2.0])
        self.assertEqual(response.json()['bpm'], 72)
        self.assertEqual(response.json()['meter'], '4/4')
        self.assertEqual(response.json()['key_fifths'], 0)
        self.assertEqual(response.json()['measure_starts'], [])
        self.assertEqual(response.json()['source_measure_note_starts'], [0])
        self.assertIn('<score-partwise', response.json()['source_musicxml'])

    def test_imports_long_musicxml_without_truncating_at_256_notes(self):
        notes = ''.join(
            '<note><pitch><step>G</step><octave>4</octave></pitch>'
            '<duration>1</duration><voice>1</voice></note>'
            for _ in range(300)
        )
        xml = (
            '<?xml version="1.0" encoding="UTF-8"?>'
            '<score-partwise version="4.0">'
            '<part-list><score-part id="P1"><part-name>Sax</part-name></score-part></part-list>'
            '<part id="P1"><measure number="1">'
            '<attributes><divisions>1</divisions></attributes>'
            f'{notes}</measure></part></score-partwise>'
        ).encode()
        score = SimpleUploadedFile(
            'long-score.musicxml', xml,
            content_type='application/vnd.recordare.musicxml+xml',
        )
        response = self.client.post(reverse('import_score'), {'score': score})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()['notes']), 300)

    def test_rejects_score_with_falsified_extension(self):
        fake_score = SimpleUploadedFile('score.pdf', b'<script>alert(1)</script>', content_type='application/pdf')
        response = self.client.post(reverse('import_score'), {'score': fake_score})
        self.assertEqual(response.status_code, 400)
        self.assertIn('conteudo', response.json()['message'])

    def test_user_can_save_and_reopen_own_score(self):
        self.client.force_login(self.user)
        payload = {
            'title': 'Escala de Sol',
            'score_data': {
                'notes': ['G4', 'A4'], 'beats': [1, 1], 'meter': '4/4', 'bpm': 72,
                'measureStarts': [],
            },
        }
        created = self.client.post(
            reverse('saved_scores'), data=json.dumps(payload), content_type='application/json'
        )
        self.assertEqual(created.status_code, 201)
        self.assertEqual(SavedScore.objects.get().user, self.user)
        listed = self.client.get(reverse('saved_scores'))
        self.assertEqual(listed.status_code, 200)
        self.assertEqual(listed.json()['scores'][0]['title'], 'Escala de Sol')

        other_user = get_user_model().objects.create_user(
            username='other-student', password='test-pass-123'
        )
        self.client.force_login(other_user)
        other_user_list = self.client.get(reverse('saved_scores'))
        self.assertEqual(other_user_list.json()['scores'], [])
