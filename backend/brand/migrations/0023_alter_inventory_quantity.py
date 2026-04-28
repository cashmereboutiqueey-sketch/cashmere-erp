from decimal import Decimal
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('brand', '0022_shippingmanifest_order_detailed_status_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='inventory',
            name='quantity',
            field=models.DecimalField(decimal_places=3, default=Decimal('0.000'), max_digits=10),
        ),
    ]
