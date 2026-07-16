import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('app', '0003_labeledsample_practicesession'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddField(
            model_name='location',
            name='user',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AddField(
            model_name='labeledsample',
            name='client_id',
            field=models.CharField(blank=True, default='', max_length=64),
        ),
        migrations.AddConstraint(
            model_name='labeledsample',
            constraint=models.UniqueConstraint(
                condition=~models.Q(client_id=''),
                fields=('user', 'client_id'),
                name='unique_sample_client_id_per_user',
            ),
        ),
        migrations.AddConstraint(
            model_name='practicesession',
            constraint=models.UniqueConstraint(
                condition=~models.Q(client_id=''),
                fields=('user', 'client_id'),
                name='unique_session_client_id_per_user',
            ),
        ),
    ]
