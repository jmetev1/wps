"""create_noon_forecasts

Revision ID: aa34d6c338e6
Revises: 891900abdb6b
Create Date: 2020-07-28 16:40:51.064232

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'aa34d6c338e6'
down_revision = '891900abdb6b'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic ###
    op.create_table('noon_forecasts',
                    sa.Column('id', sa.Integer(), nullable=False),
                    sa.Column('weather_date', sa.TIMESTAMP(
                        timezone=True), nullable=False),
                    sa.Column('station_code', sa.Integer(), nullable=False),
                    sa.Column('temp_valid', sa.Boolean(), nullable=False),
                    sa.Column('temperature', sa.Float(), nullable=False),
                    sa.Column('rh_valid', sa.Boolean(), nullable=False),
                    sa.Column('relative_humidity', sa.Float(), nullable=False),
                    sa.Column('wdir_valid', sa.Boolean(), nullable=False),
                    sa.Column('wind_direction', sa.Float(), nullable=False),
                    sa.Column('wspeed_valid', sa.Boolean(), nullable=False),
                    sa.Column('wind_speed', sa.Float(), nullable=False),
                    sa.Column('precip_valid', sa.Boolean(), nullable=False),
                    sa.Column('precipitation', sa.Float(), nullable=False),
                    sa.Column('gc', sa.Float(), nullable=False),
                    sa.Column('ffmc', sa.Float(), nullable=False),
                    sa.Column('dmc', sa.Float(), nullable=False),
                    sa.Column('dc', sa.Float(), nullable=False),
                    sa.Column('isi', sa.Float(), nullable=False),
                    sa.Column('bui', sa.Float(), nullable=False),
                    sa.Column('fwi', sa.Float(), nullable=False),
                    sa.Column('danger_rating', sa.Integer(), nullable=False),
                    sa.Column('created_at', sa.TIMESTAMP(
                        timezone=True), nullable=False),
                    sa.PrimaryKeyConstraint('id'),
                    sa.UniqueConstraint('weather_date', 'station_code', 'temp_valid', 'temperature', 'rh_valid', 'relative_humidity', 'wdir_valid', 'wind_direction',
                                        'wspeed_valid', 'wind_speed', 'precip_valid', 'precipitation', 'gc', 'ffmc', 'dmc', 'dc', 'isi', 'bui', 'fwi', 'danger_rating'),
                    comment='The noon_forecast for a weather station and weather date.'
                    )
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic ###
    op.drop_table('noon_forecasts')
    # ### end Alembic commands ###
