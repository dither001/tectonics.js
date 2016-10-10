'use strict';

var Float32RasterGraphics = {};

Float32RasterGraphics.threshold_select = function(field, threshold, result) {
	result = result || Uint8Raster(field.grid);

	for (var i=0, li=field.length; i<li; ++i) {
	    result[i] = field[i] > threshold? 1 : 0;
	}

	return result;
}

Float32RasterGraphics.copy_into_selection = function(field, copied, selection, result) {
	result = result || Uint8Raster(field.grid);

	for (var i=0, li=field.length; i<li; ++i) {
	    result[i] = selection[i] === 1? copied[i] : field[i];
	}

	return result;
}

Float32RasterGraphics.fill_into_selection = function(field, fill, selection, result) {
	result = result || Uint8Raster(field.grid);

	for (var i=0, li=field.length; i<li; ++i) {
	    result[i] = selection[i] === 1? fill : field[i];
	}

	return result;
}

