"""Allow null wind direction

Revision ID: 4e810be22ffd
Revises: 0d46262707af
Create Date: 2023-03-23 10:44:30.314054

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '4e810be22ffd'
down_revision = '0d46262707af'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.alter_column('morecast_forecast', 'wind_direction',
                    existing_type=sa.INTEGER(),
                    nullable=True)
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic ###
    # If we're downgrading and the table contains rows with null values, the downgrade will fail
    # We get around this by arbitrarily setting wind_direction to a value of -1 before making the field non-nullable
    op.execute('UPDATE morecast_forecast SET wind_direction = -1 WHERE wind_direction IS NULL')
    op.alter_column('morecast_forecast', 'wind_direction',
                    existing_type=sa.INTEGER(),
                    nullable=False)
    # ### end Alembic commands ###