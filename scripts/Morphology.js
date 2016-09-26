'use strict';

var Morphology = {};
Morphology.VertexTypedArray = function(grid) {
	return new Uint8Array(grid.vertices.length);
}
Morphology.to_binary = function(field, threshold, result) {
	result = result || new Uint8Array(field.length);
	threshold = threshold || 0;

	for (var i=0, li=field.length; i<li; ++i) {
	    result[i] = (field[i] > threshold)? 1:0;
	}

	return result;
}
Morphology.to_float = function(field, result) {
	result = result || new Float32Array(field.length);
	
	for (var i=0, li=field.length; i<li; ++i) {
	    result[i] = (field[i]===1)? 1:0;
	}

	return result;
}
Morphology.copy = function(field, result) {
	result = result || new Uint8Array(field.length);
	for (var i=0, li=field.length; i<li; ++i) {
	    result[i] = field[i];
	}
	return result;
}

Morphology.universal = function(field) {
	for (var i=0, li=field.length; i<li; ++i) {
	    field[i] = 1;
	}
}
Morphology.empty = function(field) {
	for (var i=0, li=field.length; i<li; ++i) {
	    field[i] = 0;
	}
}

Morphology.union = function(field1, field2, result) {
	result = result || new Uint8Array(field1.length);

	for (var i=0, li=field1.length; i<li; ++i) {
	    result[i] = (field1[i]===1 || field2[i]===1)? 1:0;
	}

	return result;
}

Morphology.intersection = function(field1, field2, result) {
	result = result || new Uint8Array(field1.length);

	for (var i=0, li=field1.length; i<li; ++i) {
	    result[i] = (field1[i]===1 && field2[i]===1)? 1:0;
	}

	return result;
}

Morphology.difference = function(field1, field2, result) {
	result = result || new Uint8Array(field1.length);

	for (var i=0, li=field1.length; i<li; ++i) {
	    result[i] = (field1[i]===1 && field2[i]===0)? 1:0;
	}

	return result;
}

Morphology.negation = function(field, result) {
	result = result || new Uint8Array(field1.length);

	for (var i=0, li=field1.length; i<li; ++i) {
	    result[i] = (field1[i]===0)? 1:0;
	}

	return result;
}

Morphology.dilation = function(field, grid, radius, result) {
	radius = radius || 1;
	result = result || new Uint8Array(field.length);
	var buffer1 = radius % 2 == 1? result: 				new Uint8Array(field.length);
	var buffer2 = radius % 2 == 0? result: 				Morphology.copy(field);
	var temp = buffer1;

	var neighbor_lookup = grid.neighbor_lookup;
	var neighbors = [];
	var buffer_i = true;

	for (var k=0; k<radius; ++k) {
		for (var i=0, li=neighbor_lookup.length; i<li; ++i) {
		    neighbors = neighbor_lookup[i];
		    buffer_i = buffer2[i];
		    for (var j=0, lj=neighbors.length; j<lj; ++j) {
		        buffer_i = buffer_i || buffer2[neighbors[j]];
		    }
		    buffer1[i] = buffer_i? 1:0;
		}
		temp = buffer1;
		buffer1 = buffer2;
		buffer2 = temp;
	}

	return buffer2;
}
Morphology.erosion = function(field, grid, radius, result) {
	radius = radius || 1;
	result = result || new Uint8Array(field.length);
	var buffer1 = radius % 2 == 1? result: 				new Uint8Array(field.length);
	var buffer2 = radius % 2 == 0? result: 				Morphology.copy(field);
	var temp = buffer1;

	var neighbor_lookup = grid.neighbor_lookup;
	var neighbors = [];
	var buffer_i = true;

	for (var k=0; k<radius; ++k) {
		for (var i=0, li=neighbor_lookup.length; i<li; ++i) {
		    neighbors = neighbor_lookup[i];
		    buffer_i = buffer2[i];
		    for (var j=0, lj=neighbors.length; j<lj; ++j) {
		        buffer_i = buffer_i && buffer2[neighbors[j]];
		    }
		    buffer1[i] = buffer_i? 1:0;
		}
		temp = buffer1;
		buffer1 = buffer2;
		buffer2 = temp;
	}

	return buffer2;
}
Morphology.opening = function(field, grid, radius) {
	var result = Morphology.erosion(field, grid, radius);
	return Morphology.dilation(result, grid, radius);
}
Morphology.closing = function(field, grid, radius) {
	var result = Morphology.dilation(field, grid, radius);
	return Morphology.erosion(result, grid, radius);
}
Morphology.white_top_hat = function(field, grid, radius) {
	var closing = Morphology.closing(field, grid, radius);
	return Morphology.difference(closing, field);
}
Morphology.black_top_hat = function(field, grid, radius) {
	var opening = Morphology.opening(field, grid, radius);
	return Morphology.difference(field, opening);
}