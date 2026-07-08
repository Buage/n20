const params = new URLSearchParams(window.location.search);

function setCookie(name,value,days) {
    var expires = "";
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days*24*60*60*1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "")  + expires + "; path=/";
}

function getCookie(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for(var i=0;i < ca.length;i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1,c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
    }
    return null;
}

function eraseCookie(name) {   
    document.cookie = name +'=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
}

document.getElementById('shortenBtn').addEventListener('click', function() {
    const urlInput = document.getElementById('urlInput')
    const handle = document.getElementById('urlHandleInput')

    document.getElementById('shortenBtn').disabled = true
    document.getElementById('shortenBtn').classList.add('loading')

    if (!urlInput.value.startsWith("https://")) {
        urlInput.value = "https://" +urlInput.value
    }

    const formData = new FormData()
    formData.append("url", urlInput.value)

    if (handle.value !== "") {
        formData.append("handle", handle.value)
    }

    fetch("https://api.n20.me/shorten.php", {
        method: "POST",
        body: formData
    })
    .then(res => res.json())
    .then(data => {

        if (data.error) {
            const notifTemplate = document.querySelector('.notification')
            const notif = notifTemplate.cloneNode(true)

            notif.classList.remove('hidden')

            notif.querySelector('img').src = '/files/error.png'

            notif.querySelector('h3').textContent = "Error"
            notif.querySelector('p').textContent = data.error
            notif.style.animation = "slide-down 0.3s cubic-bezier(0.1, 0.3, 0.5, 0.8)";

            document.getElementById('shortenBtn').disabled = false
            document.getElementById('shortenBtn').classList.remove('loading')

            document.querySelector('.wrapper').appendChild(notif)

            setTimeout(() => {
                notif.style.animation = "fadeOut 0.2s";

                setTimeout(() => {
                    notif.remove()
                }, 200);
            }, 2000);

            return;
        }

        setCookie("temp-key", data.secretKey, 1)
        setCookie("temp-original", encodeURIComponent(urlInput.value), 1)

        navigator.clipboard.writeText(data.short_url)

        const notifTemplate = document.querySelector('.notification')
        const notif = notifTemplate.cloneNode(true)

        notif.classList.remove('hidden')

        notif.querySelector('img').src = '/files/check.png'

        notif.querySelector('h3').textContent = "Copied!"
        notif.querySelector('p').textContent = "We've copied the new link to your clipboard!"
        notif.style.animation = "slide-down 0.3s cubic-bezier(0.1, 0.3, 0.5, 0.8)";

        document.getElementById('shortenBtn').disabled = false
        document.getElementById('shortenBtn').classList.remove('loading')

        document.querySelector('.wrapper').appendChild(notif)

        setTimeout(() => {
            notif.style.animation = "fadeOut 0.2s";

            setTimeout(() => {
                notif.remove()
            }, 200);

            window.location.href = "/?s=1"
        }, 2000);
    })
});

if (params.get('r')) {
    fetch("https://api.n20.me/resolve.php?h=" + params.get('r'))
    .then(res => res.json())
    .then(data => {
        document.querySelector('.main-content').style.display = "none"
        document.querySelector('.redirect-content').style.display = "flex"

        document.querySelector('.domain-to-redirect').textContent = data.resolved_url
        document.getElementById('redirectBtn').addEventListener('click', function() {
            window.location.href = data.resolved_url
        })

        const timeEl = document.querySelector('.time-remaining');

        for (let i = 10; i >= 0; i--) {
            setTimeout(() => {
                timeEl.textContent = i;

                if (i === 0) {
                    window.location.href = data.resolved_url;
                }
            }, (10 - i) * 1000);
        }
    })
}

const secretKeyEl = document.querySelector('.secret-key');

if (params.get('s') === "1") {
    document.querySelector('.main-content').style.display = "none";
    document.querySelector('.stats-content').style.display = "flex";

    if (secretKeyEl) {
        secretKeyEl.addEventListener('click', function() {
            secretKeyEl.classList.remove('blur7');
        });
    }

    if (getCookie('temp-key')) {
        fetch("https://api.n20.me/resolve.php?s=" + getCookie('temp-key'))
        .then(res => res.json())
        .then(data => {
            document.getElementById('linkClicks').textContent = data.clicks + " clicks"
            document.getElementById('shortenedLink').textContent = data.short_url || "-"
            document.getElementById('originalLink').textContent = data.resolved_url || decodeURIComponent(getCookie('temp-original')) || "-"
        });

        document.querySelector('.secret-key-text').textContent = "https://n20.me/?s=" + getCookie('temp-key')
    }
} else if (params.get('s')) {
    document.querySelector('.main-content').style.display = "none";
    document.querySelector('.stats-content').style.display = "flex";

    if (secretKeyEl) {
        secretKeyEl.addEventListener('click', function() {
            secretKeyEl.classList.remove('blur7');
        });
    }

    if (params.get('s')) {
        fetch("http://192.168.1.150:7766/resolve.php?s=" + getCookie('temp-key'))
        .then(res => res.json())
        .then(data => {
            document.getElementById('linkClicks').textContent = data.clicks + " clicks"
            document.getElementById('shortenedLink').textContent = data.short_url || "-"
            document.getElementById('originalLink').textContent = data.resolved_url || decodeURIComponent(getCookie('temp-original')) || "-"
        });

        document.querySelector('.secret-key-text').textContent = "https://n20.me/?s=" + getCookie('temp-key')
    }
}

document.getElementById('deleteBtn').addEventListener('click', function() {
    const fdata = new FormData()
    fdata.append('secretKey', getCookie('temp-key'))

    fetch("https://api.n20.me/delete.php", {
        method: "POST",
        body: fdata
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            const notifTemplate = document.querySelector('.notification')
            const notif = notifTemplate.cloneNode(true)

            notif.classList.remove('hidden')

            notif.querySelector('img').src = '/files/check.png'

            notif.querySelector('h3').textContent = "Success"
            notif.querySelector('p').textContent = data.message
            notif.style.animation = "slide-down 0.3s cubic-bezier(0.1, 0.3, 0.5, 0.8)";

            document.querySelector('.wrapper').appendChild(notif)

            setTimeout(() => {
                notif.style.animation = "fadeOut 0.2s";

                setTimeout(() => {
                    notif.remove()
                    window.location.href = "/"
                }, 200);
            }, 2000);

            return;
        }
    });
});

fetch("https://fuck.buage.dev/stats.php")
.then(res => res.json())
.then(data => {
    document.querySelector('.header-views').textContent = data.totals.visits + ' views'
})

fetch('https://fuck.buage.dev/visit.php');