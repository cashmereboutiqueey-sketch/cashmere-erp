from django.db import migrations, models


class Migration(migrations.Migration):
    """
    Add a partial unique constraint on (reference_id, module) where reference_id != ''.
    Prevents duplicate ledger entries for the same job/order reference within a module.
    Partial constraint excludes empty reference_ids (manual/bulk expense entries).
    """

    dependencies = [
        ('finance', '0005_financialtransaction_indexes_unique'),
    ]

    operations = [
        migrations.AddConstraint(
            model_name='financialtransaction',
            constraint=models.UniqueConstraint(
                fields=['reference_id', 'module'],
                condition=~models.Q(reference_id=''),
                name='unique_reference_per_module',
            ),
        ),
    ]
