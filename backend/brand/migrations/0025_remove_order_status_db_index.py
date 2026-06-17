from django.db import migrations, models


class Migration(migrations.Migration):
    """
    Drop the single-column db_index on Order.status.
    The composite index (status, created_at) added in 0024 makes it redundant.
    """

    dependencies = [
        ('brand', '0024_order_status_created_at_index'),
    ]

    operations = [
        migrations.AlterField(
            model_name='order',
            name='status',
            field=models.CharField(
                choices=[
                    ('PENDING', 'Pending'),
                    ('PENDING_PRODUCTION', 'Pending Production'),
                    ('READY', 'Ready'),
                    ('PAID', 'Paid'),
                    ('FULFILLED', 'Fulfilled'),
                    ('RETURNED', 'Returned'),
                    ('CANCELLED', 'Cancelled'),
                ],
                default='PENDING',
                max_length=20,
            ),
        ),
    ]
