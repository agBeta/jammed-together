// See https://nodejs.org/api/util.html#class-utiltextdecoder.

const decoder = new TextDecoder();
const u8arr = new Uint8Array([72, 101, 108, 108, 111]);
console.log(decoder.decode(u8arr)); // Hello 

const encoder = new TextEncoder();
const uint8array = encoder.encode('this is some data'); 
console.log(uint8array);
/**
 Uint8Array(17) [
  116, 104, 105, 115,  32,
  105, 115,  32, 115, 111,
  109, 101,  32, 100,  97,
  116,  97
]
 */


const ui2 = encoder.encode('🍰');
console.log(ui2);
// Uint8Array(4) [ 240, 159, 141, 176 ]

const ui3 = new TextEncoder().encode('سلام');
console.log(ui3);

const salam = decoder.decode(ui3);
console.log(salam); // سلام

const badlyDecoded = new TextDecoder('ascii').decode(ui3);
console.log(badlyDecoded); // Ø³Ù„Ø§Ù…