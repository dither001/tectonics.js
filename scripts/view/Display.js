'use strict';

var displays = {};


function ScalarDisplay(options) {
	var color = options['color'] || 0x000000;
	var min = options['min'] || '0.';
	var max = options['max'] || '1.';
	var scalar = options['scalar'] || 'vScalar';
	this.getField = options['getField'];
	this._fragmentShader = fragmentShaders.template
		.replace('@OUTPUT',
			_multiline(function() {/**   
			vec4 uncovered 		= @UNCOVERED;
			vec4 ocean 			= mix(OCEAN, uncovered, 0.5);
			vec4 sea_covered 	= vDisplacement < sealevel * sealevel_mod? ocean : uncovered;
			gl_FragColor = sea_covered;
			**/}))
		.replace('@UNCOVERED', 'mix( vec4(1), vec4(color,1.), smoothstep(@MIN, @MAX, @SCALAR) )')
		.replace('@MIN', min)
		.replace('@MAX', max)
		.replace('@SCALAR', scalar);
	this._color = new THREE.Color(color);
}
ScalarDisplay.prototype.addTo = function(mesh) {
	mesh.material.fragmentShader = this._fragmentShader;
	mesh.material.needsUpdate = true;

	mesh.material.uniforms.color.value = this._color;
	mesh.material.uniforms.color.needsUpdate = true;
};
ScalarDisplay.prototype.removeFrom = function(mesh) {
	
};
ScalarDisplay.prototype.updateAttributes = function(geometry, plate) {
	var geometry, displacement, scalar;
	displacement = geometry.attributes.displacement.array;
	scalar = geometry.attributes.scalar.array;
	var buffer_array_to_cell = view.grid.buffer_array_to_cell;
	var buffer_array_index; 
	var is_member_model = plate.is_member; 
	var displacement_model = plate.displacement; 
	var scalar_model = this.getField !== void 0? this.getField(plate) : void 0;
	var is_member;
	for(var j=0, lj = displacement.length; j<lj; j++){ 
		buffer_array_index = buffer_array_to_cell[j];
		is_member = is_member_model[buffer_array_index]
		displacement[j] = is_member * displacement_model[buffer_array_index]; 
		if (scalar_model !== void 0) {
			scalar[j] = is_member * scalar_model[buffer_array_index]; 
		}
	}
	geometry.attributes.displacement.needsUpdate = true;
	if (scalar_model !== void 0) {
		geometry.attributes.scalar.needsUpdate = true;
	}
}
displays.npp 	= new ScalarDisplay( {color: 0x00ff00, scalar: 'npp'} );
displays.alt 	= new ScalarDisplay( {color: 0x000000, min:'sealevel', max:'maxheight', scalar: 'alt'} );


function ScalarHeatDisplay(options) {
	var min = options['min'] || '0.';
	var max = options['max'] || '1.';
	var scalar = options['scalar'] || 'vScalar';
	this.getField = options['getField'];
	this._fragmentShader = fragmentShaders.template
		.replace('@OUTPUT',
			_multiline(function() {/**   
			vec4 uncovered 		= @UNCOVERED;
			vec4 ocean 			= mix(OCEAN, uncovered, 0.5);
			vec4 sea_covered 	= vDisplacement < sealevel * sealevel_mod? ocean : uncovered;
			gl_FragColor = sea_covered;
			**/}))
		.replace('@UNCOVERED', 'heat( smoothstep(@MIN, @MAX, @SCALAR) )')
		.replace('@MIN', min)
		.replace('@MAX', max)
		.replace('@SCALAR', scalar);
}
ScalarHeatDisplay.prototype.addTo = function(mesh) {
	mesh.material.fragmentShader = this._fragmentShader;
	mesh.material.needsUpdate = true;
};
ScalarHeatDisplay.prototype.removeFrom = function(mesh) {
	
};
ScalarHeatDisplay.prototype.updateAttributes = function(geometry, plate) {
	var geometry, displacement, scalar;
	displacement = geometry.attributes.displacement.array;
	scalar = geometry.attributes.scalar.array;
	var buffer_array_to_cell = view.grid.buffer_array_to_cell;
	var buffer_array_index; 
	var is_member_model = plate.is_member; 
	var displacement_model = plate.displacement; 
	var scalar_model = this.getField !== void 0? this.getField(plate) : void 0;
	var is_member;
	for(var j=0, lj = displacement.length; j<lj; j++){ 
		buffer_array_index = buffer_array_to_cell[j];
		is_member = is_member_model[buffer_array_index]
		displacement[j] = is_member * displacement_model[buffer_array_index]; 
		if (scalar_model !== void 0) {
			scalar[j] = is_member * scalar_model[buffer_array_index]; 
		}
	}
	geometry.attributes.displacement.needsUpdate = true;
	if (scalar_model !== void 0) {
		geometry.attributes.scalar.needsUpdate = true;
	}
}
displays.temp 	= new ScalarHeatDisplay( { min: '-25.', max: '30.', scalar: 'temp', } );
displays.precip = new ScalarHeatDisplay( { min: '2000.', max: '0.', scalar: 'precip', } );
displays.age 	= new ScalarHeatDisplay( { min: '250.', max: '0.',  
		getField: function (plate) {
			return plate.age;
		} 
	} );
displays.subductability = new ScalarHeatDisplay( { 
		getField: function (plate) {
			function lerp(a,b, x){
				return a + x*(b-a);
			}
			function smoothstep (edge0, edge1, x) {
				var fraction = (x - edge0) / (edge1 - edge0);
				return clamp(fraction, 0.0, 1.0);
				// return t * t * (3.0 - 2.0 * t);
			}
			function clamp (x, minVal, maxVal) {
				return Math.min(Math.max(x, minVal), maxVal);
			}
			function heaviside_approximation (x, k) {
				return 2 / (1 + Math.exp(-k*x)) - 1;
				return x>0? 1: 0; 
			}
			function get_subductability (density, age) {
				var continent = smoothstep(2800, 3000, density);
				var density = 	density * (1-continent) 	+ 
								lerp(density, 3300, smoothstep(0,280, age)) * continent
				return heaviside_approximation( density - 3000, 1/111 );
			}
			var subductability = ScalarField.TypedArray(plate.grid);
			var is_member = plate.is_member;
			var age = plate.age;
			var density = plate.density;
			for (var i=0, li=subductability.length; i<li; ++i) {
			    subductability[i] = is_member[i] * get_subductability(density[i], age[i]);
			}
			return subductability;
		} 
	} );


function RealisticDisplay(shader_return_value) {
	this._fragmentShader = fragmentShaders.template
		.replace('@OUTPUT',
			_multiline(function() {/**   
			vec4 ocean 				= mix(OCEAN, SHALLOW, smoothstep(epipelagic * sealevel_mod, sealevel * sealevel_mod, vDisplacement));
			vec4 bedrock			= mix(MAFIC, FELSIC, felsic_fraction);
			vec4 soil				= mix(bedrock, mix(SAND, PEAT, organic_fraction), mineral_fraction);
			vec4 canopy 			= mix(soil, JUNGLE, npp);
			
			vec4 uncovered = @UNCOVERED;
			vec4 sea_covered = vDisplacement < sealevel * sealevel_mod? ocean : uncovered;
			vec4 ice_covered = mix(sea_covered, SNOW, ice_fraction);
			gl_FragColor = ice_covered;
			**/}))
		.replace('@UNCOVERED', shader_return_value);
}
RealisticDisplay.prototype.addTo = function(mesh) {
	mesh.material.fragmentShader = this._fragmentShader;
	mesh.material.needsUpdate = true;
};
RealisticDisplay.prototype.removeFrom = function(mesh) {
	
};
RealisticDisplay.prototype.updateAttributes = function(geometry, plate) {
	var geometry, displacement, scalar;
	displacement = geometry.attributes.displacement.array;
	var buffer_array_to_cell = view.grid.buffer_array_to_cell;
	var buffer_array_index; 
	var is_member_model = plate.is_member; 
	var displacement_model = plate.displacement; 
	var is_member;
	for(var j=0, lj = displacement.length; j<lj; j++){ 
		buffer_array_index = buffer_array_to_cell[j];
		is_member = is_member_model[buffer_array_index]
		displacement[j] = is_member * displacement_model[buffer_array_index]; 
	}
	geometry.attributes.displacement.needsUpdate = true;
}
displays.satellite = new RealisticDisplay('canopy');
displays.soil = new RealisticDisplay('soil');
displays.bedrock = new RealisticDisplay('bedrock');


function DebugDisplay(shader_return_value) {
	this._fragmentShader = fragmentShaders.debug;
}
DebugDisplay.prototype.addTo = function(mesh) {
	mesh.material.fragmentShader = this._fragmentShader;
	mesh.material.needsUpdate = true;
	mesh.material.uniforms.color.value =  new THREE.Color(Math.random() * 0xffffff);
	mesh.material.uniforms.color.needsUpdate = true;
};
DebugDisplay.prototype.removeFrom = function(mesh) {
	
};
DebugDisplay.prototype.updateAttributes = function(geometry, plate) {
	var geometry, displacement, scalar;
	displacement = geometry.attributes.displacement.array;
	var buffer_array_to_cell = view.grid.buffer_array_to_cell;
	var buffer_array_index; 
	var is_member_model = plate.is_member; 
	var displacement_model = plate.displacement; 
	var is_member;
	for(var j=0, lj = displacement.length; j<lj; j++){ 
		buffer_array_index = buffer_array_to_cell[j];
		is_member = is_member_model[buffer_array_index]
		displacement[j] = is_member * displacement_model[buffer_array_index]; 
	}
	geometry.attributes.displacement.needsUpdate = true;
}
displays.debug = new DebugDisplay();