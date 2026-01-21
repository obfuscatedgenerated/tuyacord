const config = {
    host: 'https://openapi.tuyaeu.com',
    accessKey: '',
    secretKey: '',
    deviceId: '',
};

let token = '';

export async function configureTuya(accessKey: string, secretKey: string, deviceId: string) {
    config.accessKey = accessKey;
    config.secretKey = secretKey;
    config.deviceId = deviceId;
    await getToken();
}

export async function getHost() {
    return config.host;
}

export async function sendCommands(commands: {code: string, value: any }[]) {
    const body = {
        commands,
    };

    const method = 'POST';
    const url = `/v1.0/iot-03/devices/${config.deviceId}/commands`;

    const headers = await getRequestSign(url, method, {}, {}, body);

    const response = await fetch(config.host + url, { method, headers, body: JSON.stringify(body) });
    return response;
}

async function getToken() {
    const method = 'GET';
    const timestamp = Date.now().toString();
    const signUrl = '/v1.0/token?grant_type=1';
    const contentHash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(''));
    const hashStr =  Array.from(new Uint8Array(contentHash)).map(b => b.toString(16).padStart(2, '0')).join('');
    const stringToSign = [method, hashStr, '', signUrl].join('\n');
    const signStr = config.accessKey + timestamp + stringToSign;

    const headers = {
        t: timestamp,
        sign_method: 'HMAC-SHA256',
        client_id: config.accessKey,
        sign: await encryptStr(signStr, config.secretKey),
    };

    const response = await fetch(config.host + signUrl, { headers });
    const login = await response.json();

    if (!login || !login.success) {
        throw Error(`Authorization Failed: ${login.msg}`);
    }
    token = login.result.access_token;
}

async function encryptStr(str: string, secret: string) {
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(str));
    return Array.from(new Uint8Array(signature)).map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
}

export async function getRequestSign(path: string, method: string, headers = {}, query = {}, body = {}) {
    const t = Date.now().toString();
    const [uri, pathQuery] = path.split('?');
    const queryMerged = Object.assign(query, new URLSearchParams(pathQuery).entries());
    const sortedQuery = {};
    Object.keys(queryMerged).sort().forEach(i => sortedQuery[i] = query[i]);
    const querystring = new URLSearchParams(sortedQuery).toString();
    const url = querystring ? `${uri}?${querystring}` : uri;
    const contentHash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(body)));
    const hashStr =  Array.from(new Uint8Array(contentHash)).map(b => b.toString(16).padStart(2, '0')).join('');
    const stringToSign = [method, hashStr, '', url].join('\n');
    const signStr = config.accessKey + token + t + stringToSign;
    return {
        t,
        path: url,
        client_id: config.accessKey,
        sign: await encryptStr(signStr, config.secretKey),
        sign_method: 'HMAC-SHA256',
        access_token: token,
    };
}