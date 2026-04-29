from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('finance', '0004_treasury_module_intercompany'),
    ]

    operations = [
        migrations.AlterUniqueTogether(
            name='financialtransaction',
            unique_together={('reference_id', 'module', 'category')},
        ),
        migrations.AddIndex(
            model_name='financialtransaction',
            index=models.Index(fields=['type', 'module', 'date'], name='finance_ft_type_module_date_idx'),
        ),
        migrations.AddIndex(
            model_name='financialtransaction',
            index=models.Index(fields=['module', 'category'], name='finance_ft_module_category_idx'),
        ),
    ]
