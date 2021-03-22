(function () {
    console.log("connected");
    console.log("connected again");
    const canvas = $("#canv");
    const ctx = $("#canv")[0].getContext("2d");
    let drawing = false;
    const clearButton = $("#clear");
    const sigInput = $("#hiddenInput");
    canvas.mouseenter(function () {
        console.log("mouseenter");
    });

    canvas.mousedown(function (e) {
        drawing = true;
        canvas.toggleClass(".pencursor");
        ctx.beginPath();
        ctx.moveTo(e.originalEvent.layerX, e.originalEvent.layerY);
        // specify a style, which is always a colour
    });

    canvas.mousemove(function (e) {
        if (drawing) {
            ctx.lineTo(e.originalEvent.layerX, e.originalEvent.layerY);
            ctx.strokeStyle = "black";
            ctx.lineWidth = 3;
            ctx.stroke();
        }
    });

    canvas.mouseleave(function () {
        drawing = false;
    });

    canvas.mouseup(function (e) {
        drawing = false;
        const sigData = e.target.toDataURL();
        sigInput.val(sigData);
        console.log(sigInput.val());
    });

    clearButton.click(function () {
        console.log("clicked");
        ctx.clearRect(0, 0, canvas.width() + 10, canvas.height() + 10);
    });
})();
