const http = require('http');

const postData = JSON.stringify({
    full_name: 'Test User',
    username: 'testuser_' + Date.now(),
    email: 'test' + Date.now() + '@example.com',
    mobile_number: '1234567890',
    password: 'password123'
});

const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/register',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
    }
};

const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        console.log('Register Response:', res.statusCode, data);
        if (res.statusCode === 201) {
            testLogin();
        } else {
            process.exit(1);
        }
    });
});

req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
    process.exit(1);
});

req.write(postData);
req.end();

function testLogin() {
    const loginData = JSON.stringify({
        username: JSON.parse(postData).username,
        password: 'password123'
    });

    const loginOptions = {
        hostname: 'localhost',
        port: 5000,
        path: '/login',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(loginData)
        }
    };

    const loginReq = http.request(loginOptions, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
            console.log('Login Response:', res.statusCode, data);
            if (res.statusCode === 200) {
                console.log('Verification Successful!');
                process.exit(0);
            } else {
                process.exit(1);
            }
        });
    });

    loginReq.write(loginData);
    loginReq.end();
}
