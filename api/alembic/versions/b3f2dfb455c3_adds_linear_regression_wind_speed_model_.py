"""Adds linear regression wind speed model value

Revision ID: b3f2dfb455c3
Revises: aa82757b1084
Create Date: 2021-05-11 14:46:25.887958

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'b3f2dfb455c3'
down_revision = 'aa82757b1084'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('weather_station_model_predictions', sa.Column('linear_wind_tgl_10', sa.Float(), nullable=True))
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_column('weather_station_model_predictions', 'linear_wind_tgl_10')
    # ### end Alembic commands ###