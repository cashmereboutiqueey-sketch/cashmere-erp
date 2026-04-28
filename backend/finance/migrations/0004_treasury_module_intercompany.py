from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('finance', '0003_alter_financialtransaction_date'),
    ]

    operations = [
        migrations.AddField(
            model_name='treasury',
            name='module',
            field=models.CharField(
                choices=[('BRAND', 'Brand'), ('FACTORY', 'Factory'), ('SHARED', 'Shared')],
                default='SHARED',
                max_length=10,
            ),
        ),
        migrations.AlterField(
            model_name='financialtransaction',
            name='type',
            field=models.CharField(
                choices=[
                    ('TRANSFER', 'Factory to Brand Transfer'),
                    ('SALE', 'Sales Revenue'),
                    ('EXPENSE', 'Expense'),
                    ('INTERNAL', 'Internal Treasury Transfer'),
                    ('INTERCOMPANY', 'Inter-Company Settlement'),
                ],
                max_length=20,
            ),
        ),
    ]
