from django.urls import path
from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("api/location/", views.location_update, name="location_update"),
    path("locations/", views.locations_list, name="locations_list"),
    path("audio/", views.audio, name="audio"),
    path("api/fetch_chord_sheet/", views.fetch_chord_sheet, name="fetch_chord_sheet"),
    path("api/upload_audio/", views.upload_audio, name="upload_audio"),
    path("api/upload_sample/", views.upload_sample, name="upload_sample"),
    path("api/sync_local_data/", views.sync_local_data, name="sync_local_data"),
    path("recordings/", views.recordings_list, name="recordings_list"),
    path("dashboard/", views.student_dashboard, name="student_dashboard"),
    path("dashboard/teacher/", views.teacher_dashboard, name="teacher_dashboard"),
]
