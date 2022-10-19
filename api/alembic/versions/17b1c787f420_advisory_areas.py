"""advisory areas

Revision ID: 17b1c787f420
Revises: 62d35d76e1bf
Create Date: 2022-08-31 22:46:45.138215

"""
from alembic import op
import sqlalchemy as sa
import geoalchemy2


# revision identifiers, used by Alembic.
revision = '17b1c787f420'
down_revision = '62d35d76e1bf'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic! ###
    op.create_table('advisory_shape_types',
                    sa.Column('id', sa.Integer(), nullable=False),
                    sa.Column('name', sa.Enum('fire_centre', 'fire_zone', name='shapetypeenum'), nullable=False),
                    sa.PrimaryKeyConstraint('id'),
                    comment='Identify kind of advisory area (e.g. Zone, Fire etc.)'
                    )
    op.create_index(op.f('ix_advisory_shape_types_name'), 'advisory_shape_types', ['name'], unique=True)
    op.create_table('advisory_shapes',
                    sa.Column('id', sa.Integer(), nullable=False),
                    sa.Column('source_identifier', sa.String(), nullable=False),
                    sa.Column('shape_type', sa.Integer(), nullable=False),
                    sa.Column('geom', geoalchemy2.types.Geometry(geometry_type='MULTIPOLYGON',
                                                                 spatial_index=False, from_text='ST_GeomFromEWKT', name='geometry'), nullable=False),
                    sa.ForeignKeyConstraint(['shape_type'], ['advisory_shape_types.id'], ),
                    sa.PrimaryKeyConstraint('id'),
                    sa.UniqueConstraint('source_identifier', 'shape_type'),
                    comment='Record identifying some area of interest with respect to advisories'
                    )
    op.create_index('idx_advisory_shapes_geom', 'advisory_shapes', ['geom'], unique=False, postgresql_using='gist')
    op.create_index(op.f('ix_advisory_shapes_shape_type'), 'advisory_shapes', ['shape_type'], unique=False)
    op.create_index(op.f('ix_advisory_shapes_source_identifier'),
                    'advisory_shapes', ['source_identifier'], unique=False)
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic! ###
    op.drop_index(op.f('ix_advisory_shapes_source_identifier'), table_name='advisory_shapes')
    op.drop_index(op.f('ix_advisory_shapes_shape_type'), table_name='advisory_shapes')
    op.drop_index('idx_advisory_shapes_geom', table_name='advisory_shapes', postgresql_using='gist')
    op.drop_table('advisory_shapes')
    op.drop_index(op.f('ix_advisory_shape_types_name'), table_name='advisory_shape_types')
    op.drop_table('advisory_shape_types')
    # ### end Alembic commands ###
    sa.Enum(name='shapetypeenum').drop(op.get_bind())
