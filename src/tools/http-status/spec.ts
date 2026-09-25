import type { ReferenceSpec } from "../reference-tool";

/**
 * The status codes, with the line that settles an argument in review.
 *
 * The descriptions say what the code means for the *client*, because that is
 * what is being decided when someone looks one up: whether to retry, whether
 * to re-authenticate, whether the request can be repeated as-is.
 */
export const spec: ReferenceSpec = {
  bilingualColumn: 2,
  columns: [
    { tr: "Kod", en: "Code" },
    { tr: "Ad", en: "Name" },
    { tr: "Anlamı", en: "Meaning" },
  ],
  rows: [
    [
      "100",
      "Continue",
      "İstemci gövdeyi göndermeye devam edebilir. / The client may continue sending the body.",
    ],
    [
      "101",
      "Switching Protocols",
      "Protokol değiştiriliyor — WebSocket el sıkışması. / Protocol upgrade, as in a WebSocket handshake.",
    ],
    ["200", "OK", "İstek başarılı. / The request succeeded."],
    [
      "201",
      "Created",
      "Kaynak oluşturuldu; Location başlığında adresi. / A resource was created; its address is in Location.",
    ],
    [
      "202",
      "Accepted",
      "Kabul edildi ama daha işlenmedi. / Accepted but not processed yet.",
    ],
    [
      "204",
      "No Content",
      "Başarılı, gövde yok. DELETE ve PUT'un olağan cevabı. / Success with no body; the usual answer to DELETE and PUT.",
    ],
    [
      "206",
      "Partial Content",
      "Range isteğine kısmi cevap. / A partial answer to a Range request.",
    ],
    [
      "301",
      "Moved Permanently",
      "Kalıcı taşındı; istemci adresi güncellemeli. / Moved for good; clients should update the address.",
    ],
    [
      "302",
      "Found",
      "Geçici yönlendirme; yöntem değişebilir. / A temporary redirect that may change the method.",
    ],
    [
      "303",
      "See Other",
      "POST sonrası GET'e yönlendir. / Redirect to a GET after a POST.",
    ],
    [
      "304",
      "Not Modified",
      "Önbellek geçerli, gövde gönderilmedi. / The cache is still valid; no body sent.",
    ],
    [
      "307",
      "Temporary Redirect",
      "Geçici, yöntem korunur. / Temporary, and the method is preserved.",
    ],
    [
      "308",
      "Permanent Redirect",
      "Kalıcı, yöntem korunur. / Permanent, and the method is preserved.",
    ],
    [
      "400",
      "Bad Request",
      "İstek bozuk; aynen tekrar göndermek işe yaramaz. / Malformed; resending as-is will not help.",
    ],
    [
      "401",
      "Unauthorized",
      "Kimlik doğrulanmadı — aslında 'unauthenticated'. / Not authenticated, despite the name.",
    ],
    [
      "403",
      "Forbidden",
      "Kimlik tamam, yetki yok. / Authenticated, but not allowed.",
    ],
    [
      "404",
      "Not Found",
      "Kaynak yok ya da gizleniyor. / No such resource, or it is being hidden.",
    ],
    [
      "405",
      "Method Not Allowed",
      "Adres var, yöntem desteklenmiyor. / The path exists; the method does not.",
    ],
    [
      "408",
      "Request Timeout",
      "İstemci isteği zamanında göndermedi. / The client did not finish the request in time.",
    ],
    [
      "409",
      "Conflict",
      "Mevcut durumla çelişiyor — sürüm çakışması. / Conflicts with the current state, such as a version clash.",
    ],
    [
      "410",
      "Gone",
      "Vardı, kalıcı olarak kaldırıldı. / It existed and was removed for good.",
    ],
    ["413", "Payload Too Large", "Gövde çok büyük. / The body is too large."],
    [
      "415",
      "Unsupported Media Type",
      "Content-Type desteklenmiyor. / The Content-Type is not supported.",
    ],
    [
      "418",
      "I'm a teapot",
      "Şaka olarak eklendi, gerçekten standart. / A joke that really is in a standard.",
    ],
    [
      "422",
      "Unprocessable Content",
      "Söz dizimi doğru, doğrulama başarısız. / Syntactically fine, semantically invalid.",
    ],
    [
      "425",
      "Too Early",
      "Tekrar oynatma riski var, sonra dene. / Replay risk; try again later.",
    ],
    [
      "428",
      "Precondition Required",
      "If-Match gibi bir koşul gerekiyor. / A condition such as If-Match is required.",
    ],
    [
      "429",
      "Too Many Requests",
      "Hız sınırı; Retry-After başlığına bak. / Rate limited; read Retry-After.",
    ],
    [
      "451",
      "Unavailable For Legal Reasons",
      "Hukuki nedenle engellendi. / Blocked for legal reasons.",
    ],
    [
      "500",
      "Internal Server Error",
      "Sunucu hatası; istemci bir şey değiştiremez. / A server fault; nothing the client can change.",
    ],
    [
      "501",
      "Not Implemented",
      "Yöntem sunucuda yok. / The server does not implement the method.",
    ],
    [
      "502",
      "Bad Gateway",
      "Vekil, yukarıdan geçersiz cevap aldı. / A proxy got an invalid answer upstream.",
    ],
    [
      "503",
      "Service Unavailable",
      "Geçici olarak kapalı; Retry-After olabilir. / Temporarily down; Retry-After may be present.",
    ],
    [
      "504",
      "Gateway Timeout",
      "Vekil, yukarıdan zamanında cevap alamadı. / A proxy timed out waiting upstream.",
    ],
    [
      "507",
      "Insufficient Storage",
      "Sunucuda yer kalmadı. / The server is out of space.",
    ],
  ],
};
