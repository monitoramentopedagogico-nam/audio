from django.db import models


class Message(models.Model):
    text = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.text


class Location(models.Model):
    latitude = models.FloatField()
    longitude = models.FloatField()
    accuracy = models.FloatField(null=True, blank=True)
    recorded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.latitude:.6f}, {self.longitude:.6f} @ {self.recorded_at.isoformat()}"


class Recording(models.Model):
    user = models.ForeignKey(
        'auth.User', null=True, blank=True, on_delete=models.SET_NULL
    )
    file = models.FileField(upload_to='recordings/')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Recording {self.id} ({self.created_at.isoformat()})"


class LabeledSample(models.Model):
    user = models.ForeignKey('auth.User', null=True, blank=True, on_delete=models.SET_NULL)
    recording = models.ForeignKey(Recording, null=True, blank=True, on_delete=models.SET_NULL)
    exercise = models.CharField(max_length=64, blank=True)
    labels = models.JSONField(default=dict, blank=True)
    features = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"LabeledSample {self.id} ({self.created_at.isoformat()})"


class PracticeSession(models.Model):
    user = models.ForeignKey('auth.User', null=True, blank=True, on_delete=models.SET_NULL)
    client_id = models.CharField(max_length=64, blank=True, default='')
    exercise = models.CharField(max_length=64, blank=True)
    session_data = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    synced_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"PracticeSession {self.id} ({self.exercise})"
