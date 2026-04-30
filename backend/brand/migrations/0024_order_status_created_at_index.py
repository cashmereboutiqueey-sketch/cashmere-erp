from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('brand', '0023_alter_inventory_quantity'),
    ]

    operations = [
        migrations.AddIndex(
            model_name='order',
            index=models.Index(fields=['status', 'created_at'], name='brand_order_status_created_idx'),
        ),
    ]
