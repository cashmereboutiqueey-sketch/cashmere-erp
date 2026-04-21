import datetime
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('finance', '0002_financialtransaction_category_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='financialtransaction',
            name='date',
            field=models.DateField(default=datetime.date.today, help_text='Date of transaction'),
        ),
    ]
