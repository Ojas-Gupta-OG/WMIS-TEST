<script>
(() => {

    const field = document.getElementById("dot-field");

    if (!field) return;

    const isMobile = window.matchMedia("(max-width: 600px)").matches;

    const DOT_COUNT = isMobile ? 35 : 75;

    const dots = [];

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;

    let targetMouseX = mouseX;
    let targetMouseY = mouseY;

    /* Create dots */

    for (let i = 0; i < DOT_COUNT; i++) {

        const dot = document.createElement("span");

        dot.className =
            "dot-particle" +
            (Math.random() > 0.86 ? " highlight" : "");

        const x = Math.random() * window.innerWidth;
        const y = Math.random() * window.innerHeight;

        dot.style.left = x + "px";
        dot.style.top = y + "px";

        field.appendChild(dot);

        dots.push({
            element: dot,

            x: x,
            y: y,

            baseX: x,
            baseY: y,

            vx: (Math.random() - 0.5) * 0.18,
            vy: (Math.random() - 0.5) * 0.18,

            size: Math.random() * 0.8 + 0.7
        });
    }

    /* Mouse movement */

    window.addEventListener(
        "mousemove",
        (event) => {

            targetMouseX = event.clientX;
            targetMouseY = event.clientY;

            document.documentElement.style.setProperty(
                "--mouse-x",
                targetMouseX + "px"
            );

            document.documentElement.style.setProperty(
                "--mouse-y",
                targetMouseY + "px"
            );
        },
        { passive: true }
    );

    /* Animation */

    function animate() {

        mouseX += (targetMouseX - mouseX) * 0.08;
        mouseY += (targetMouseY - mouseY) * 0.08;

        dots.forEach(dot => {

            /* Very slow natural movement */

            dot.baseX += dot.vx;
            dot.baseY += dot.vy;

            /* Wrap around screen */

            if (dot.baseX < -20)
                dot.baseX = window.innerWidth + 20;

            if (dot.baseX > window.innerWidth + 20)
                dot.baseX = -20;

            if (dot.baseY < -20)
                dot.baseY = window.innerHeight + 20;

            if (dot.baseY > window.innerHeight + 20)
                dot.baseY = -20;


            /* Distance from mouse */

            const dx = mouseX - dot.baseX;
            const dy = mouseY - dot.baseY;

            const distance = Math.sqrt(
                dx * dx + dy * dy
            );

            const interactionRadius = 150;


            let offsetX = 0;
            let offsetY = 0;


            /* Mouse influence */

            if (distance < interactionRadius) {

                const force =
                    (1 - distance / interactionRadius);

                /*
                 * Slight attraction toward mouse.
                 * Keeps the effect elegant instead of chaotic.
                 */

                offsetX += dx * force * 0.08;
                offsetY += dy * force * 0.08;
            }


            /* Render */

            const finalX =
                dot.baseX + offsetX;

            const finalY =
                dot.baseY + offsetY;

            dot.element.style.transform =
                `translate3d(${finalX - dot.baseX}px,
                             ${finalY - dot.baseY}px,
                             0)`;

            /*
             * Small opacity change near cursor.
             */

            if (distance < interactionRadius) {

                const opacity =
                    0.28 +
                    (1 - distance / interactionRadius) * 0.32;

                dot.element.style.opacity = opacity;

            } else {

                dot.element.style.opacity = 0.28;
            }
        });

        requestAnimationFrame(animate);
    }

    animate();

    /* Reposition dots correctly after resize */

    window.addEventListener(
        "resize",
        () => {

            dots.forEach(dot => {

                if (dot.baseX > window.innerWidth)
                    dot.baseX = Math.random() * window.innerWidth;

                if (dot.baseY > window.innerHeight)
                    dot.baseY = Math.random() * window.innerHeight;
            });

        },
        { passive: true }
    );

})();
</script>