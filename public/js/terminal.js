export function terminal(){let t=localStorage.getItem('schoolTerminalId');if(!t){t='C'+String(Math.floor(Math.random()*999)+1).padStart(3,'0');localStorage.setItem('schoolTerminalId',t)}return t}
