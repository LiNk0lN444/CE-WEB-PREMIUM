const themeBtn = document.getElementById("themeBtn");

themeBtn.addEventListener("click", () => {

    document.body.classList.toggle("dark-mode");

    if(document.body.classList.contains("dark-mode")){
        themeBtn.textContent = "☀️";
        localStorage.setItem("theme","dark");
    }else{
        themeBtn.textContent = "🌙";
        localStorage.setItem("theme","light");
    }

});

if(localStorage.getItem("theme") === "dark"){
    document.body.classList.add("dark-mode");
    themeBtn.textContent = "☀️";
}