
from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('app_sessions', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='session',
            name='image_file',
            field=models.ImageField(blank=True, help_text='Upload image file', null=True, upload_to='sessions/'),
        ),
    ]
