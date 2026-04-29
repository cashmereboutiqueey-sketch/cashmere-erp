from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('brand', '0022_shippingmanifest_order_detailed_status_and_more'),
    ]

    operations = [
        migrations.AddIndex(
            model_name='order',
            index=models.Index(fields=['status', 'created_at'], name='brand_order_status_created_idx'),
        ),
    ]
