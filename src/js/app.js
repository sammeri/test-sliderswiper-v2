window.addEventListener("load", () => {
  const swiper = new Swiper(".mySwiper", {
    direction: "vertical",
    loop: true,
    slidesPerView: 1,
    mousewheel: true,
    initialSlide: 0,
  });

  const buttons = Array.from(document.querySelectorAll(".arc-item"));
  const path = document.getElementById("arcPath");
  const svg = document.getElementById("arcSvg");

  const btnSize = 74;
  const gap = 40;
  const step = btnSize + gap;
  const xCorrection = 0.9;
  const yCorrection = 0.92;
  const xOffsetCorrection = [-15, -20, -20, -20, -15];

  const totalButtons = buttons.length;
  const totalLength = path.getTotalLength();
  const base = totalLength / 2 - (step * 4) / 2;

  let initMode = true;
  let lastIndex = swiper.realIndex;
  const positionsAlongPath = buttons.map(() => base + 2 * step);

  buttons.forEach((btn) => {
    btn.style.position = "absolute";
    btn.style.transition = "transform 0.3s ease, opacity 0.4s ease";
  });

  // easing функция для плавного движения
  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  // Рассчёт целевых позиций кнопок
  function getTargetPositions(activeIndex, direction) {
    return buttons.map((btn, i) => {
      let diff = i - activeIndex;
      if (diff < -Math.floor(totalButtons / 2)) diff += totalButtons;
      if (diff > Math.floor(totalButtons / 2)) diff -= totalButtons;

      let posIdx = null;
      let opacity = 0;
      let scale = 1;
      let outside = null;

      if ([-2, -1, 0, 1, 2].includes(diff)) {
        posIdx = diff + 2;
        opacity = 1;
        scale = diff === 0 ? 1.3 : 1;
      } else {
        if (initMode) {
          posIdx = diff < 0 ? 0 : 4;
          opacity = 0;
        } else {
          // Скрытые кнопки "выезжают" сверху или снизу в зависимости от направления
          if (direction === "down") {
            // Скролл вниз — кнопка появляется сверху и движется вниз
            outside = { x: -200, y: -200 };
          } else {
            // Скролл вверх — кнопка появляется снизу и движется вверх
            outside = { x: -200, y: window.innerHeight + 200 };
          }
          opacity = 0;
        }
      }

      const lengthOnPath = posIdx !== null ? base + posIdx * step : null;
      return { posIdx, opacity, scale, outside, lengthOnPath };
    });
  }

  function animateButtons(targetIndex) {
    const direction =
      targetIndex > lastIndex ||
      (lastIndex === totalButtons - 1 && targetIndex === 0)
        ? "down"
        : "up";

    lastIndex = targetIndex;

    const svgRect = svg.getBoundingClientRect();
    const viewBox = svg.viewBox.baseVal;
    const duration = initMode ? 400 : 200;
    const startTime = performance.now();

    const targetPositions = getTargetPositions(targetIndex, direction);
    const startPositions = positionsAlongPath.slice();

    function animate(now) {
      let rawProgress = (now - startTime) / duration;
      if (rawProgress > 1) rawProgress = 1;
      const progress = easeOutCubic(rawProgress);

      buttons.forEach((btn, i) => {
        const target = targetPositions[i];
        let x, y;
        let finalOpacity = target.opacity;

        if (target.posIdx !== null) {
          let preLength;
          if (direction === "down" && startPositions[i] === 0) {
            preLength = base - step * 2;
          } else if (direction === "up" && startPositions[i] === 0) {
            preLength = base + step * 6;
          } else {
            preLength = startPositions[i];
          }

          const length =
            preLength + (target.lengthOnPath - preLength) * progress;
          const point = path.getPointAtLength(length);

          const scaleX = (svgRect.width / viewBox.width) * xCorrection;
          const scaleY = (svgRect.height / viewBox.height) * yCorrection;

          x = point.x * scaleX + xOffsetCorrection[target.posIdx];
          y = point.y * scaleY;

          if (preLength !== startPositions[i] && progress < 0.9) {
            finalOpacity = 0;
          }
        } else {
          x = target.outside.x;
          y = target.outside.y;
        }

        btn.style.left = `${x}px`;
        btn.style.top = `${y}px`;
        btn.style.transform = `scale(${target.scale})`;
        btn.style.opacity = finalOpacity;
      });

      if (rawProgress < 1) requestAnimationFrame(animate);
      else {
        buttons.forEach((_, i) => {
          positionsAlongPath[i] =
            targetPositions[i].lengthOnPath ??
            (targetPositions[i].outside ? 0 : positionsAlongPath[i]);
        });

        // --- добавить/снять класс active ---
        buttons.forEach((btn, i) => {
          if (i === targetIndex) {
            btn.classList.add("active");
          } else {
            btn.classList.remove("active");
          }
        });

        if (initMode) initMode = false;
      }
    }

    requestAnimationFrame(animate);
  }

  // --- старт ---
  animateButtons(swiper.realIndex);

  swiper.on("slideChangeTransitionStart", () =>
    animateButtons(swiper.realIndex)
  );

  buttons.forEach((btn, i) =>
    btn.addEventListener("click", () => swiper.slideToLoop(i))
  );

  window.addEventListener("resize", () => animateButtons(swiper.realIndex));
});
