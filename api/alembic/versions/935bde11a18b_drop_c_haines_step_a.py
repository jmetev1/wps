"""drop c-haines

Revision ID: 935bde11a18b
Revises: 4ac7d9f38f85
Create Date: 2021-06-10 11:03:32.506075

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
import geoalchemy2

# revision identifiers, used by Alembic.
revision = '935bde11a18b'
down_revision = '4ac7d9f38f85'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - and adjusted ###
    op.drop_index('idx_c_haines_polygons_geom', table_name='c_haines_polygons')
    op.drop_index('ix_c_haines_polygons_c_haines_prediction_id', table_name='c_haines_polygons')
    op.drop_index('ix_c_haines_polygons_id', table_name='c_haines_polygons')
    op.drop_table('c_haines_polygons')
    op.execute('DROP TYPE c_haines_severity_levels')


def downgrade():
    # ### commands auto generated by Alembic - and adjusted ###
    op.create_table('c_haines_polygons',
                    sa.Column('id', sa.INTEGER(), autoincrement=True, nullable=False),
                    sa.Column('geom', geoalchemy2.types.Geometry(geometry_type='POLYGON',
                              from_text='ST_GeomFromEWKT', name='geometry'), autoincrement=False, nullable=False),
                    sa.Column('c_haines_index', postgresql.ENUM('<4', '4-8', '8-11', '>11',
                                                                name='c_haines_severity_levels'), autoincrement=False, nullable=False),
                    sa.Column('c_haines_prediction_id', sa.INTEGER(), autoincrement=False, nullable=False),
                    sa.ForeignKeyConstraint(['c_haines_prediction_id'], ['c_haines_predictions.id'],
                                            name='c_haines_polygons_c_haines_prediction_id_fkey'),
                    sa.PrimaryKeyConstraint('id', name='c_haines_polygons_pkey')
                    )
    op.create_index('ix_c_haines_polygons_id', 'c_haines_polygons', ['id'], unique=False)
    op.create_index('ix_c_haines_polygons_c_haines_prediction_id',
                    'c_haines_polygons', ['c_haines_prediction_id'], unique=False)
    # ### end Alembic commands ###
