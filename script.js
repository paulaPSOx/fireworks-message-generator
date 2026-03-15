// Seleção do canvas e configuração inicial da área de desenho
var c = document.getElementById('c'),
    w = c.width = window.innerWidth,
    h = c.height = window.innerHeight,
    ctx = c.getContext('2d'),

    // Metade da largura e altura da tela (usado para centralização)
    hw = w / 2,
    hh = h / 2,

    // Configurações gerais da animação
    opts = {
        strings: ['FELIZ', 'ANIVERSÁRIO!'],
        charSize: 30,
        charSpacing: 35,
        lineHeight: 40,

        cx: w / 2,
        cy: h / 2,

        // Configurações do foguete (fogos de artifício)
        fireworkPrevPoints: 10,
        fireworkBaseLineWidth: 5,
        fireworkAddedLineWidth: 8,
        fireworkSpawnTime: 200,
        fireworkBaseReachTime: 30,
        fireworkAddedReachTime: 30,
        fireworkCircleBaseSize: 20,
        fireworkCircleAddedSize: 10,
        fireworkCircleBaseTime: 30,
        fireworkCircleAddedTime: 30,
        fireworkCircleFadeBaseTime: 10,
        fireworkCircleFadeAddedTime: 5,

        // Configurações das partículas da explosão
        fireworkBaseShards: 5,
        fireworkAddedShards: 5,
        fireworkShardPrevPoints: 3,
        fireworkShardBaseVel: 4,
        fireworkShardAddedVel: 2,
        fireworkShardBaseSize: 3,
        fireworkShardAddedSize: 3,

        gravity: 0.1,
        upFlow: -0.1,

        // Tempo em que a letra fica parada após a explosão
        letterContemplatingWaitTime: 360,

        // Configurações do balão
        balloonSpawnTime: 20,
        balloonBaseInflateTime: 10,
        balloonAddedInflateTime: 10,
        balloonBaseSize: 20,
        balloonAddedSize: 20,
        balloonBaseVel: 0.4,
        balloonAddedVel: 0.4,
        balloonBaseRadian: -(Math.PI / 2 - 0.5),
        balloonAddedRadian: -1,
    },

    // Cálculo da largura total do texto
    calc = {
        totalWidth: opts.charSpacing * Math.max(opts.strings[0].length, opts.strings[1].length)
    },

    Tau = Math.PI * 2,
    TauQuarter = Tau / 4,

    // Array que armazenará todas as letras da animação
    letras = [];

// Define a fonte usada no canvas
ctx.font = opts.charSize + 'px Verdana';

/*
Classe responsável por representar cada letra da mensagem.
Cada letra possui sua própria animação:
1) foguete
2) explosão
3) contemplação
4) balão
*/
function Letra(char, x, y) {
    this.char = char;
    this.x = x;
    this.y = y;

    // Centralização do caractere
    this.dx = -ctx.measureText(char).width / 2;
    this.dy = +opts.charSize / 2;

    this.fogosDy = this.y - hh;

    // Define uma cor baseada na posição da letra
    var hue = (x / calc.totalWidth) * 360;
    this.color = 'hsl(' + hue + ',80%,50%)';
    this.lightAlphaColor = 'hsla(' + hue + ',80%,light%,alp)';
    this.lightColor = 'hsl(' + hue + ',80%,light%)';
    this.alphaColor = 'hsla(' + hue + ',80%,50%,alp)';

    this.resetar();
}

// Reinicia o estado da letra
Letra.prototype.resetar = function() {
    this.fase = 'fogos de artifício';
    this.tick = 0;
    this.spawned = false;

    // Tempo aleatório para início do foguete
    this.spawningTime = (opts.fireworkSpawnTime * Math.random()) | 0;

    this.reachTime = opts.fireworkBaseReachTime + (opts.fireworkAddedReachTime * Math.random()) | 0;
    this.lineWidth = opts.fireworkBaseLineWidth + opts.fireworkAddedLineWidth * Math.random();

    // Pontos usados para desenhar o rastro do foguete
    this.prevPoints = [[0, hh, 0]];
};

/* Função principal de atualização da letra.
Controla todas as fases da animação. */
Letra.prototype.avancar = function() {

    // Fase 1 — Lançamento do foguete
    if (this.fase === 'fogos de artifício') {

        if (!this.spawned) {

            ++this.tick;

            if (this.tick >= this.spawningTime) {
                this.tick = 0;
                this.spawned = true;
            }

        } else {

            ++this.tick;

            var linearProportion = this.tick / this.reachTime;
            var armonicProportion = Math.sin(linearProportion * TauQuarter);

            var x = linearProportion * this.x;
            var y = hh + armonicProportion * this.fogosDy;

            if (this.prevPoints.length > opts.fireworkPrevPoints)
                this.prevPoints.shift();

            this.prevPoints.push([x, y, linearProportion * this.lineWidth]);

            var lineWidthProportion = 1 / (this.prevPoints.length - 1);

            // Desenha rastro do foguete
            for (var i = 1; i < this.prevPoints.length; ++i) {

                var point = this.prevPoints[i];
                var point2 = this.prevPoints[i - 1];

                ctx.strokeStyle = this.alphaColor.replace('alp', i / this.prevPoints.length);
                ctx.lineWidth = point[2] * lineWidthProportion * i;

                ctx.beginPath();
                ctx.moveTo(point[0], point[1]);
                ctx.lineTo(point2[0], point2[1]);
                ctx.stroke();
            }

            // Quando o foguete chega ao destino, inicia a explosão
            if (this.tick >= this.reachTime) {

                this.fase = 'contemplar';

                this.circleFinalSize = opts.fireworkCircleBaseSize + opts.fireworkCircleAddedSize * Math.random();

                this.circleCompleteTime =
                    (opts.fireworkCircleBaseTime + opts.fireworkCircleAddedTime * Math.random()) | 0;

                this.circleCreating = true;
                this.circleFading = false;

                this.circleFadeTime =
                    (opts.fireworkCircleFadeBaseTime + opts.fireworkCircleFadeAddedTime * Math.random()) | 0;

                this.tick = 0;
                this.tick2 = 0;

                this.estilhas = [];

                // Criação das partículas da explosão
                var shardCount = (opts.fireworkBaseShards + opts.fireworkAddedShards * Math.random()) | 0;

                var angle = Tau / shardCount;
                var cos = Math.cos(angle);
                var sin = Math.sin(angle);

                var x = 1;
                var y = 0;

                for (var i = 0; i < shardCount; ++i) {

                    var x1 = x;
                    x = x * cos - y * sin;
                    y = y * cos + x1 * sin;

                    this.estilhas.push(new Estilhaço(this.x, this.y, x, y, this.alphaColor));
                }
            }
        }

    } else if (this.fase === 'contemplar') {
        ++this.tick;

        // Criação do círculo da explosão
        if (this.circleCreating) {
            ++this.tick2;
            var proportion = this.tick2 / this.circleCompleteTime;
            var armonic = -Math.cos(proportion * Math.PI) / 2 + 0.5;

            ctx.beginPath();
            ctx.fillStyle = this.lightAlphaColor.replace('light', 50 + 50 * proportion).replace('alp', proportion);
            ctx.beginPath();
            ctx.arc(this.x, this.y, armonic * this.circleFinalSize, 0, Tau);
            ctx.fill();

            if (this.tick2 > this.circleCompleteTime) {
                this.tick2 = 0;
                this.circleCreating = false;
                this.circleFading = true;
            }

        // Desaparecimento gradual do círculo
        } else if (this.circleFading) {

            ctx.fillStyle = this.lightColor.replace('light', 70);
            ctx.fillText(this.char, this.x + this.dx, this.y + this.dy);

            ++this.tick2;
            var proportion = this.tick2 / this.circleFadeTime;
            var armonic = -Math.cos(proportion * Math.PI) / 2 + 0.5;

            ctx.beginPath();
            ctx.fillStyle = this.lightAlphaColor.replace('light', 100).replace('alp', 1 - armonic);
            ctx.arc(this.x, this.y, this.circleFinalSize, 0, Tau);
            ctx.fill();

            if (this.tick2 >= this.circleFadeTime)
                this.circleFading = false;

        } else {

            // Exibe a letra após explosão
            ctx.fillStyle = this.lightColor.replace('light', 70);
            ctx.fillText(this.char, this.x + this.dx, this.y + this.dy);
        }

        // Atualiza partículas da explosão
        for (var i = 0; i < this.estilhas.length; ++i) {

            this.estilhas[i].avancar();

            if (!this.estilhas[i].vivo) {
                this.estilhas.splice(i, 1);
                --i;
            }
        }

        // Após tempo de contemplação inicia fase do balão
        if (this.tick > opts.letterContemplatingWaitTime) {

            this.fase = 'balão';
            this.tick = 0;

            this.spawning = true;
            this.spawnTime = (opts.balloonSpawnTime * Math.random()) | 0;

            this.inflating = false;
            this.inflateTime = (opts.balloonBaseInflateTime +
                opts.balloonAddedInflateTime * Math.random()) | 0;

            this.size = (opts.balloonBaseSize +
                opts.balloonAddedSize * Math.random()) | 0;

            var rad = opts.balloonBaseRadian +
                opts.balloonAddedRadian * Math.random();

            var vel = opts.balloonBaseVel +
                opts.balloonAddedVel * Math.random();

            this.vx = Math.cos(rad) * vel;
            this.vy = Math.sin(rad) * vel;
        }

    } else if (this.fase === 'balão') {

        ctx.strokeStyle = this.lightColor.replace('light', 80);

        // Tempo antes do balão aparecer
        if (this.spawning) {

            ++this.tick;

            ctx.fillStyle = this.lightColor.replace('light', 70);
            ctx.fillText(this.char, this.x + this.dx, this.y + this.dy);

            if (this.tick >= this.spawnTime) {
                this.tick = 0;
                this.spawning = false;
                this.inflating = true;
            }

        // Animação de inflar balão
        } else if (this.inflating) {

            ++this.tick;

            var proportion = this.tick / this.inflateTime;

            var x = this.cx = this.x;
            var y = this.cy = this.y - this.size * proportion;

            ctx.fillStyle = this.alphaColor.replace('alp', proportion);

            ctx.beginPath();
            gerarCaminhoBalão(x, y, this.size * proportion);
            ctx.fill();

            // Linha do balão
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x, this.y);
            ctx.stroke();

            ctx.fillStyle = this.lightColor.replace('light', 70);
            ctx.fillText(this.char, this.x + this.dx, this.y + this.dy);

            if (this.tick >= this.inflateTime) {
                this.tick = 0;
                this.inflating = false;
            }

        } else {

            // Movimento do balão no ar
            this.cx += this.vx;
            this.cy += this.vy += opts.upFlow;

            ctx.fillStyle = this.color;

            ctx.beginPath();
            gerarCaminhoBalão(this.cx, this.cy, this.size);
            ctx.fill();

            ctx.beginPath();
            ctx.moveTo(this.cx, this.cy);
            ctx.lineTo(this.cx, this.cy + this.size);
            ctx.stroke();

            ctx.fillStyle = this.lightColor.replace('light', 70);
            ctx.fillText(this.char,
                this.cx + this.dx,
                this.cy + this.dy + this.size);

            // Remove balão quando sai da tela
            if (this.cy + this.size < -hh ||
                this.cx < -hw ||
                this.cy > hw)
                this.fase = 'feito';
        }
    }
};

/* Classe responsável pelas partículas
geradas pela explosão dos fogos. */
function Estilhaço(x, y, vx, vy, color) {

    var vel = opts.fireworkShardBaseVel +
        opts.fireworkShardAddedVel * Math.random();

    this.vx = vx * vel;
    this.vy = vy * vel;

    this.x = x;
    this.y = y;

    this.prevPoints = [[x, y]];

    this.color = color;

    this.vivo = true;

    this.size = opts.fireworkShardBaseSize +
        opts.fireworkShardAddedSize * Math.random();
}

Estilhaço.prototype.avancar = function() {

    this.x += this.vx;
    this.y += this.vy += opts.gravity;

    if (this.prevPoints.length > opts.fireworkShardPrevPoints)
        this.prevPoints.shift();

    this.prevPoints.push([this.x, this.y]);

    var lineWidthProportion =
        this.size / this.prevPoints.length;

    // Desenha rastro da partícula
    for (var k = 0; k < this.prevPoints.length - 1; ++k) {

        var point = this.prevPoints[k],
            point2 = this.prevPoints[k + 1];

        ctx.strokeStyle =
            this.color.replace('alp',
                k / this.prevPoints.length);

        ctx.lineWidth = k * lineWidthProportion;

        ctx.beginPath();
        ctx.moveTo(point[0], point[1]);
        ctx.lineTo(point2[0], point2[1]);
        ctx.stroke();
    }

    // Desativa partícula quando cai
    if (this.prevPoints[0][1] > hh)
        this.vivo = false;
};

/* Desenha o formato do balão
utilizando curvas Bézier. */
function gerarCaminhoBalão(x, y, size) {

    ctx.moveTo(x, y);

    ctx.bezierCurveTo(
        x - size / 2, y - size / 2,
        x - size / 4, y - size,
        x, y - size
    );

    ctx.bezierCurveTo(
        x + size / 4, y - size,
        x + size / 2, y - size / 2,
        x, y
    );
}

/* Loop principal de animação
usando requestAnimationFrame. */
function animar() {

    window.requestAnimationFrame(animar);

    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, w, h);

    ctx.translate(hw, hh);

    var feito = true;

    for (var l = 0; l < letras.length; ++l) {

        letras[l].avancar();

        if (letras[l].fase !== 'feito')
            feito = false;
    }

    ctx.translate(-hw, -hh);

    // Reinicia animação após terminar
    if (feito)
        for (var l = 0; l < letras.length; ++l)
            letras[l].resetar();
}

// Criação das letras da mensagem
for (var i = 0; i < opts.strings.length; ++i) {

    for (var j = 0; j < opts.strings[i].length; ++j) {

        var x =
            j * opts.charSpacing +
            opts.charSpacing / 2 -
            opts.strings[i].length *
            opts.charSize / 2;

        var y =
            i * opts.lineHeight +
            opts.lineHeight / 2 -
            opts.strings.length *
            opts.lineHeight / 2;

        letras.push(
            new Letra(
                opts.strings[i][j],
                x,
                y
            )
        );
    }
}

/* ========= ALTERAR FRASE ========= */

const fraseInput = document.getElementById("fraseInput");

fraseInput.addEventListener("input", atualizarFrase);

function atualizarFrase() {

  const texto = this.value.toUpperCase().trim();

  if (!texto) return;

  letras = [];
  opts.strings = [texto];

  for (let i = 0; i < opts.strings.length; i++) {

    for (let j = 0; j < opts.strings[i].length; j++) {

      const x =
        j * opts.charSpacing +
        opts.charSpacing / 2 -
        opts.strings[i].length * opts.charSize / 2;

      const y =
        i * opts.lineHeight +
        opts.lineHeight / 2 -
        opts.strings.length * opts.lineHeight / 2;

      letras.push(
        new Letra(
          opts.strings[i][j],
          x,
          y
        )
      );

    }

  }

}

/* ========= LANÇAR FOGOS ========= */

function lancarFogo(x, y) {

  const shardCount = 20;

  const angle = Tau / shardCount;

  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  let vx = 1;
  let vy = 0;

  for (let i = 0; i < shardCount; i++) {

    const x1 = vx;

    vx = vx * cos - vy * sin;
    vy = vy * cos + x1 * sin;

    const estilhaco = new Estilhaço(
      x - hw,
      y - hh,
      vx,
      vy,
      'hsla(' + Math.random() * 360 + ',80%,50%,alp)'
    );

    letras.push({

      fase: 'manual',

      avancar: function () {

        estilhaco.avancar();

        if (!estilhaco.vivo)
          this.fase = 'feito';

      }

    });

  }

}

/* ========= CLIQUE PARA FOGOS ========= */

c.addEventListener("click", function (e) {

  const rect = c.getBoundingClientRect();

  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  lancarFogo(x, y);

});

/* ========= RESPONSIVIDADE DO CANVAS ========= */

window.addEventListener("resize", atualizarCanvas);

function atualizarCanvas() {

  w = c.width = window.innerWidth;
  h = c.height = window.innerHeight;

  hw = w / 2;
  hh = h / 2;

  ctx.font = opts.charSize + "px Verdana";

}

/* ========= INICIAR ANIMAÇÃO ========= */

animar();
