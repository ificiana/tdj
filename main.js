// const api_endpt = "https://ificiana.alwaysdata.net/?fun="
// const api_endpt = "http://127.0.0.1:5000/?fun="
const NAMESPACE = "6cea5068-1a3d-48fc-953d-5930604e7873";
const api_endpt = `https://jp-tok.functions.appdomain.cloud/api/v1/web/${NAMESPACE}/default/app.json?fun=`;
const endpts = {
    get(k) {return `${api_endpt}tdj-get&k=${k}`},
    search(q) {return `${api_endpt}tdj-search&q=${q}`},
    edit() {return `${api_endpt}tdj-edit`}
}
const val_reject = /[.,\\\/#!+@$%\^&\*;\|:{}=\-_`~()0-9%]/g;
const debounce = (fn, ms) => {
    let timer = 0;
    return function(...args) {
        clearTimeout(timer);
        timer = setTimeout(fn.bind(this, ...args), ms || 0);
    }
}
let showEng = false;
let DATA = null;

async function search(inp) {
    let arrSearch = [], currentFocus;
    inp.addEventListener("input", debounce(async function (e) {
        let a, b, i, currentVal = this.value.replace(val_reject, "").substring(0,8);
        closeAllLists();
        if (!currentVal) return false;
        const regenList = () => {
            a = document.createElement("DIV");
            a.setAttribute("id", this.id + "-search-list");
            a.setAttribute("class", "search-items");
            this.parentNode.appendChild(a);
        }
        const addToList = T => {
            b = document.createElement("DIV");
            b.innerHTML += T;
            return b;
        }
        regenList();
        a.appendChild(addToList("Loading..."));
        arrSearch = !currentVal? []: await (async () => {
            const data = await fetch(endpts.search(currentVal));
            d = await data.json();
            return await d["res"];
        })();
        closeAllLists();
        regenList();
        currentFocus = -1;
        if (!arrSearch.length) {
            a.appendChild(addToList("No match found."));
            return;
        }
        if (arrSearch[0] != currentVal) {
            a.insertBefore(addToList(`Exact match not found, <a href='edit.html?=${currentVal}'>Create?</a>`), a.children[0]);
        }
        for (i of arrSearch) {
            b = addToList(i+"<input type='hidden' value='" + i + "'>")
            b.addEventListener("click", function () {
                inp.value = this.getElementsByTagName("input")[0].value;
                closeAllLists();
                window.location.href = `?=${inp.value}`;
            });
            a.appendChild(b);
        }
    }, 800));
    inp.addEventListener("keydown", function (e) {
        let x = document.getElementById(this.id + "-search-list");
        if (x) x = x.getElementsByTagName("div");
        switch(e.keyCode){
            case 40: 
                currentFocus++;
                addActive(x);
                return;
            case 38:
                currentFocus--;
                addActive(x);
                return;
            case 13:
                e.preventDefault();
                if (currentFocus > -1) x[currentFocus].click();
        }
    });

    function addActive(x) {
        if (!x) return false;
        removeActive(x);
        if (currentFocus >= x.length) currentFocus = 0;
        if (currentFocus < 0) currentFocus = x.length - 1;
        x[currentFocus].classList.add("search-active");
    }

    function removeActive(x) {
        for (var i = 0; i < x.length; i++) {
            x[i].classList.remove("search-active");
        }
    }

    function closeAllLists(elmnt) {
        var x = document.getElementsByClassName("search-items");
        for (var i = 0; i < x.length; i++) {
            if (elmnt != x[i] && elmnt != inp) {
                x[i].parentNode.removeChild(x[i]);
            }
        }
    }
    document.addEventListener("click", function (e) {
        closeAllLists(e.target);
    });
}

function render(str, query) {
    if(!str) return "";
    return str
        .replace(/\n\n/g, "<br>")
        .replace(/[-=_]{3,}\n/g, "<hr style='width:50%; margin: 10px auto 20px auto;'>")
        .replace(/\[k!(.+?)\]/g, `<a href='?=kanji::$1' style="color: purple">$1</a>`)
        .replace(/\[m!(.+?)\]/g, `<a href='?=meta::$1' style="color: purple">$1</a>`)
        .replace(/\[!(.+?)\]/g, `<a href='$1.html?=${query}'>$1</a>`)
        .replace(/\[(.+?)\]/g, "<a href='?=$1'>$1</a>");
}

function show_data(_json, query) {
    DATA = _json;
    const res = document.getElementById("main");
    res.innerHTML = `
    <div style="display: flex; flex-direction: row;">
    <h1>${query}</h1>
    <div style='float: right; margin: auto auto auto 10px'>
    [<a href="javascript:void(0)" onclick="showEng=false; show_data(DATA, DATA.key)">JA</a>|<a href="javascript:void(0)" onclick="showEng=true; show_data(DATA, DATA.key)">EN</a>]
    </div></div>
    <hr><h2>${(showEng?_json.esub:_json.sub) || _json.sub}</h2>
    <p>${render((showEng?_json.edef:_json.def) || "Not Avalable", query)}</p>`;
    document.getElementById("footer").innerHTML = `<hr>${render(_json.footer, query)}`;
}
async function load(query) {
    const data = await fetch(endpts.get(query));
    show_data(await data.json(), query);
}
