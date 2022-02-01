/**
 * @author Mugen87 / https://github.com/Mugen87
 */

import { BufferGeometry, LineBasicMaterial, Float32BufferAttribute, LineSegments } from 'three';

function createCellSpaceHelper( spatialIndex ) {

	const cells = spatialIndex.cells;

	const geometry = new BufferGeometry();
	const material = new LineBasicMaterial();

	const lines = new LineSegments( geometry, material );

	const positions = [];

	for ( let i = 0, l = cells.length; i < l; i ++ ) {

		const cell = cells[ i ];
		const min = cell.aabb.min;
		const max = cell.aabb.max;

		// generate data for twelve lines segments

		// bottom lines

		positions.push( min.x, min.y, min.z, 	max.x, min.y, min.z );
		positions.push( min.x, min.y, min.z, 	min.x, min.y, max.z );
		positions.push( max.x, min.y, max.z, 	max.x, min.y, min.z );
		positions.push( max.x, min.y, max.z, 	min.x, min.y, max.z );

		// top lines

		positions.push( min.x, max.y, min.z, 	max.x, max.y, min.z );
		positions.push( min.x, max.y, min.z, 	min.x, max.y, max.z );
		positions.push( max.x, max.y, max.z, 	max.x, max.y, min.z );
		positions.push( max.x, max.y, max.z, 	min.x, max.y, max.z );

		// torso lines

		positions.push( min.x, min.y, min.z, 	min.x, max.y, min.z );
		positions.push( max.x, min.y, min.z, 	max.x, max.y, min.z );
		positions.push( max.x, min.y, max.z, 	max.x, max.y, max.z );
		positions.push( min.x, min.y, max.z, 	min.x, max.y, max.z );

	}

	geometry.addAttribute( 'position', new Float32BufferAttribute( positions, 3 ) );

	return lines;

}


export { createCellSpaceHelper };
