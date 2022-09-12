const fetch = require('node-fetch');

exports.encrypt = async (plaintext)=>{
    const params = new URLSearchParams();
    params.append("action", "encrypt");
    params.append("text", plaintext);
    const response = await fetch('https://crowdfaster.com/test.php', {method: 'POST', body: params});
    return  await response.text();
}
exports.decrypt = async (ciphertext)=>{
    const params = new URLSearchParams();
    params.append("action", "decrypt");
    params.append("text", ciphertext);
    const response = await fetch('https://crowdfaster.com/test.php', {
        method: 'POST', 
        body: params,
        headers: {'Content-Type': 'application/x-www-form-urlencoded','Content-Length':300}
    });
    return  await response.text();
}