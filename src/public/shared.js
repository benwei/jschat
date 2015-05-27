function pad(n) {
   return n < 10 ? '0' : '';
}

function dateToString(y, m, d, H, M, S) {
    return y + "-" + pad(m) + m + "-" + pad(d) + d + " "
           + pad(H) + H + ":" + pad(M) + M + ":" + pad(S) + S;
}

function dateTo8601String(y, m, d, H, M, S) {
    return y + "-" + pad(m) + m + "-" + pad(d) + d + "T"
           + pad(H) + H + ":" + pad(M) + M + ":" + pad(S) + S + "Z";
}

function TStoLocaltime(ts_string)
{
    ts = parseInt(ts_string, 10);
    console.log(ts);
    var dt = new Date(ts);

    dt.setMinutes(dt.getMinutes() - dt.getTimezoneOffset());
    return dateToString(dt.getFullYear(), dt.getMonth()+1, dt.getDate(),
           dt.getHours(), dt.getMinutes(), dt.getSeconds());
}

function nowtoLocaltimeString(ts)
{
    var dt = new Date();
    return dateToString(dt.getFullYear(), dt.getMonth()+1, dt.getDate(),
           dt.getHours(), dt.getMinutes(), dt.getSeconds());
}

