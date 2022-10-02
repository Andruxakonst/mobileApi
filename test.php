<?php
$str = "6a3d8c8539b97eeb58e2e5177ca240f1";

if($_POST["action"] == "encrypt"){
    echo encrypt($_POST["text"]);
}
if($_POST["action"] == "decrypt"){
    echo decrypt($_POST["text"]);
}


function encrypt($plaintext) {
  $ivlen = openssl_cipher_iv_length($cipher="AES-128-CBC");
  $iv = openssl_random_pseudo_bytes($ivlen);
  $ciphertext_raw = openssl_encrypt($plaintext, $cipher, $str, $options=OPENSSL_RAW_DATA, $iv);
  $hmac = hash_hmac('sha256', $ciphertext_raw, $str, $as_binary=true);
  return base64_encode( $iv.$hmac.$ciphertext_raw );
}
 
function decrypt($ciphertext) {
  if($ciphertext){
    $c = base64_decode($ciphertext);
    $ivlen = openssl_cipher_iv_length($cipher="AES-128-CBC");
    $iv = substr($c, 0, $ivlen);
    $hmac = substr($c, $ivlen, $sha2len=32);
    $ciphertext_raw = substr($c, $ivlen+$sha2len);
    $plaintext = openssl_decrypt($ciphertext_raw, $cipher, $str, $options=OPENSSL_RAW_DATA, $iv);
    $calcmac = hash_hmac('sha256', $ciphertext_raw, $str, $as_binary=true);
    if (hash_equals($hmac, $calcmac))
    {
        return $plaintext;
    }
  }
}