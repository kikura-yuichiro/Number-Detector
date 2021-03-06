var maxX = 20,
	maxY = 20,
	Xcount = 9, //状態量2^4-1 + バイアス 1
	Zcount = 20,
	Ycount = 10,
	$canvas, canvas, state, tlist;

function init() {
	tlist = [];

	$canvas = $("#canvas");
	$canvas
		.mousedown(function(ev) {
			$canvas.on("mousemove", draw);
			draw(ev);
		})
		.mouseup(function(ev) {
			$canvas.off("mousemove", draw);
		});

	canvas = new Canvas($canvas[0])
		.lineWidth(1)
		.size(0, 0, maxX, maxY)

	$("#btnClear").click(clear);
	$("#btnAnalyze").click(analyze);
	$("#btnAdd").click(addTeacherData);
	$("#btnTrain").click(train);
	$("#btnSave").click(save);
	$("#btnLoad").click(load);

	clear();
}

function clear() {
	state = new V().resize(maxX * maxY, 1);
	for (var x = 0; x < maxX; x++) {
		for (var y = 0; y < maxY; y++) {
			state[x * maxY + y][0] = 0;
		}
	}

	update();
	setGageValue([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
}

function draw(ev) {
	var cellW = $canvas.width() / maxX,
		cellY = $canvas.height() / maxY,
		x = parseInt(ev.offsetX / cellW, 10),
		y = parseInt(ev.offsetY / cellY, 10);

	state[x * maxY + y][0] = 1;
	update();
}

function analyze() {
	var fVector = getFVector(state).transpose(),
		Y = perceptron.calcY(fVector);

	var sum = 0;
	for (var i = 0, max = Y.size2; i < max; i++) {
		if (Y[0][i] < 0) Y[0][i] = 0;
		sum += Y[0][i];
	}

	var gageValue = [];
	if (sum == 0) {
		gageValue = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
	} else {
		for (var i = 0; i < 10; i++) {
			gageValue.push(Y[0][i] / sum);
		}
	}

	setGageValue(gageValue);
	Y.print();
}

function addTeacherData(ev) {
	var teacher = parseInt($("#tdata").val());
	if (teacher === undefined) return;
	if (teacher >= 10) return;

	T = new V().resize(1, 10);
	T[0][teacher] = 1.0;

	var fVector = getFVector(state).transpose();

	tlist.push({
		fv: fVector,
		label: T
	});
	console.log("教師データを追加しました");
}

function train(ev) {
	for (var i = 0; i < 100; i++) {
		for (var j = 0; j < tlist.length; j++) {
			perceptron.train(tlist[j].fv, tlist[j].label);
		}
	}
	console.log("学習完了");
}

function update() {
	canvas
		.start()
		.fillColor(182, 182, 182)
		.rect(0, 0, maxX, maxY)
		.fill();

	canvas
		.fillColor(0, 128, 255)
		.start();

	for (var x = 0; x < maxX; x++) {
		for (var y = 0; y < maxY; y++) {
			if (state[x * maxY + y][0]) {
				canvas.rect(x, y, x + 1, y + 1);
			}
		}
	}

	canvas
		.fill();
}

function getFVector(v) {
	//result[0] はバイアスで常に1
	result = [1.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0];

	//	左上、右上、左下、右下　の順でビット化
	//	■□		■□
	//	□■		■■
	//	1001	1011
	//	→9		→11

	for (var x = 0; x < maxX - 1; x++) {
		for (var y = 0; y < maxY - 1; y++) {
			var i = v[x * maxY + y][0] | v[(x + 1) * maxY + y][0] << 1 | v[x * maxY + y + 1][0] << 2 | v[(x + 1) * maxY + y + 1][0] << 3,
				j = 0;
			switch (i) {
				case 3:
					j = 1;
					break;
				case 5:
					j = 2;
					break;
				case 11:
					j = 3;
					break;
				case 7:
					j = 4;
					break;
				case 13:
					j = 5;
					break;
				case 14:
					j = 6;
					break;
				case 9:
					j = 7;
					break;
				case 6:
					j = 8;
					break;
			}
			if (!j) continue;
			result[j]++;
		}
	}
	V.apply(window, result).print();

	return V.apply(window, result);
}

function setGageValue(value) {
	maxI = 0;
	maxValue = 0;

	$(".gage-max").removeClass("gage-max");
	for (var i = 0; i < 10; i++) {

		if (value[i] > maxValue) {
			maxValue = value[i];
			maxI = i;
		}

		p = value[i] * 100
		p = ("" + p).substring(0, 4) + "%";
		$("#label" + i).text(p);
		$("#gage" + i).css("width", p);
	}

	if (maxValue > 0) {
		$(".gage").eq(maxI).addClass("gage-max");
	}
}

function tanh(arg) {
	return (Math.exp(arg) - Math.exp(-arg)) / (Math.exp(arg) + Math.exp(-arg));
}

function save() {
	perceptron.save();
	console.log("保存完了");
}

function load() {
	perceptron.load();
	console.log("読み込み完了");
}

$(init);

var perceptron = (function() {
	var _ = {},
		W1 = new V(),
		W2 = new V();

	W1 = W1.resize(Xcount, Zcount);
	for (var i = 0, size1 = W1.size1; i < size1; i++) {
		for (var j = 0, size2 = W1.size2; j < size2; j++) {
			W1[i][j] = Math.random();
		}
	}

	W2 = W2.resize(Zcount, Ycount);
	for (var i = 0, size1 = W2.size1; i < size1; i++) {
		for (var j = 0, size2 = W2.size2; j < size2; j++) {
			W2[i][j] = Math.random();
		}
	}

	_.W1 = function() {
		return W1;
	};

	_.W2 = function() {
		return W2;
	};

	_.show = function() {
		console.log("----------");
		W1.print();
		console.log("----------");
		W2.print();
	}

	_.calcY = function(X) {
		var Z, Y;

		Z = W1.multi(X);
		console.log(Z[0][1]);
		for (var i = 0; i < Zcount; i++) {
			Z[0][i] = tanh(Z[0][i]);
		}
		Z[0][0] = 1.0;
		Z.print();
		console.log("----------");

		Y = W2.multi(Z);
		Y.print();

		return Y;
	};

	_.train = function(X, T) {

		var Z, Y, DELTA_Y, DELTA_Z;

		Z = W1.multi(X);
		for (var i = 0; i < Zcount; i++) {
			Z[0][i] = tanh(Z[0][i]);
		}
		Z[0][0] = 1.0;

		Y = W2.multi(Z);
		DELTA_Y = Y.sub(T);
		DELTA_Z = W2.transpose().multi(DELTA_Y);

		for (var i = 0; i < Zcount; i++) {
			DELTA_Z[0][i] = (1 - Z[0][i] * Z[0][i]) * DELTA_Z[0][i];
		}

		ETA_DELTA_Z = DELTA_Z.multi(X.transpose());
		ETA_DELTA_Y = DELTA_Y.multi(Z.transpose());
		ETA = 0.01;
		for (var i = 0, size1 = ETA_DELTA_Z.size1; i < size1; i++) {
			for (var j = 0, size2 = ETA_DELTA_Z.size2; j < size2; j++) {
				ETA_DELTA_Z[i][j] *= ETA;
			}
		}

		for (var i = 0, size1 = ETA_DELTA_Y.size1; i < size1; i++) {
			for (var j = 0, size2 = ETA_DELTA_Y.size2; j < size2; j++) {
				ETA_DELTA_Y[i][j] *= ETA;
			}
		}

		W1 = W1.sub(ETA_DELTA_Z);
		W2 = W2.sub(ETA_DELTA_Y);

		//--------------------------------------------------------------------
		//Y二乗和誤差の計算
		Z = W1.multi(X);
		for (var i = 0; i < Zcount; i++) {
			Z[0][i] = tanh(Z[0][i]);
		}
		Z[0][0] = 1.0;

		Y = W2.multi(Z);
		DELTA_Y = Y.sub(T);
		console.log("-------------------");
		console.log("教師データ");
		T.transpose().print();
		console.log("結果Y");
		Y.transpose().print();
		console.log("誤差");
		DELTA_Y.transpose().multi(DELTA_Y).print();
	}

	_.save = function() {
		w1_arr = [];
		for (var i = 0, size1 = W1.size1; i < size1; i++) {
			w1_arr.push([]);
			for (var j = 0, size2 = W1.size2; j < size2; j++) {
				w1_arr[i][j] = W1[i][j];
			}
		}

		w2_arr = [];
		for (var i = 0, size1 = W2.size1; i < size1; i++) {
			w2_arr.push([]);
			for (var j = 0, size2 = W2.size2; j < size2; j++) {
				w2_arr[i][j] = W2[i][j];
			}
		}

		localStorage.setItem("w1_arr", JSON.stringify(w1_arr));
		localStorage.setItem("w2_arr", JSON.stringify(w2_arr));

	}

	_.load = function() {
		w1_arr = JSON.parse(localStorage.getItem("w1_arr"));
		w2_arr = JSON.parse(localStorage.getItem("w2_arr"));

		W1 = V.apply(window, w1_arr);
		W2 = V.apply(window, w2_arr);
	}

	return _
}());

// var console = {
// 	log: function(txt) {
// 		$("#log")
// 			.text(txt)
// 			.fadeIn(300)
// 			.delay(2000)
// 			.fadeOut(300);
// 	}
// }
