import{mkdirSync as m,readdirSync as d,readFileSync as r,writeFileSync as w}from"node:fs";
let T='!2b%\'+,0        *******&***&*** ***             AEEA!           &)              %%"%',
E=new TextEncoder(),
I=process.env.MAKEFUN_INPUT_DIR??"/input",
O=process.env.MAKEFUN_OUTPUT_DIR??"/output",
F=(p,q)=>{
let n=p.length,D=new Int32Array(256),C=new Int32Array(64),M=new Int32Array(256),u=new Uint8Array(65536),s=0,c=0,l=0,i=0,P=0,t=0,o=0,x=0,a=0,b=0,N=0,f=e=>[u.slice(0,l),e];
for(;;){
if(t==1e6)return f(10);
if(P<0|P>=n)return f(9);
o=p[P];
if(o>83|(x=T.charCodeAt(o)-33)<0)return f(5);
if(P+(x>>4)>=n)return f(9);
t++;
if(s<(x>>2&3))return f(2);
if(s-(x>>2&3)+(x&3)>256)return f(3);
N=P+1+(x>>4);P=N;
if(o>15&o<35&o!=23&o!=27){
a=D[s-2];b=D[s-1];
if(o==16)a+=b;else if(o==17)a-=b;else if(o==18)a=Math.imul(a,b);
else if(o<23){if(!b)return f(4);a=o==19?a/b:o==20?a%b:o==21?(a>>>0)/(b>>>0):(a>>>0)%(b>>>0)}
else if(o==24)a&=b;else if(o==25)a|=b;else if(o==26)a^=b;
else if(o==28)a=a<<(b&31);else if(o==29)a=a>>(b&31);else if(o==30)a=a>>>(b&31);
else if(o==32)a=a==b?1:0;else if(o==33)a=a<b?1:0;else a=(a>>>0)<(b>>>0)?1:0;
D[s-2]=a|0;s--;continue}
switch(o){
case 0:return f(0);
case 1:D[s++]=(p[N-1]<<24)>>24;break;
case 2:D[s++]=p[N-4]|p[N-3]<<8|p[N-2]<<16|p[N-1]<<24;break;
case 3:s--;break;
case 4:D[s]=D[s-1];s++;break;
case 5:x=D[s-1];D[s-1]=D[s-2];D[s-2]=x;break;
case 6:D[s]=D[s-2];s++;break;
case 7:x=D[s-3];D[s-3]=D[s-2];D[s-2]=D[s-1];D[s-1]=x;break;
case 23:D[s-1]=-D[s-1]|0;break;
case 27:D[s-1]=~D[s-1];break;
case 48:case 49:case 50:
x=(p[N-2]|p[N-1]<<8)<<16>>16;
if(o==48||(o==49?!D[--s]:D[--s]))P=N+x;
break;
case 51:if(c==64)return f(7);C[c++]=N;P=p[N-2]|p[N-1]<<8;break;
case 52:if(!c)return f(8);P=C[--c];break;
case 64:a=D[s-1];if(a<0|a>255)return f(6);D[s-1]=M[a];break;
case 65:a=D[s-1];if(a<0|a>255)return f(6);M[a]=D[s-2];s-=2;break;
case 80:x=E.encode(D[s-1]+"");if(l+x.length>65536)return f(11);s--;u.set(x,l);l+=x.length;break;
case 81:if(l>65535)return f(11);u[l++]=D[--s]&255;break;
case 82:D[s++]=i<q.length?q[i++]:-1;break;
case 83:return f(D[--s]&255);
}
}
};
for(let y of d(I))try{let R=F(r(I+"/"+y+"/program.bin"),r(I+"/"+y+"/input.bin"));m(O+"/"+y,{recursive:true});w(O+"/"+y+"/stdout.bin",R[0]);w(O+"/"+y+"/exit.txt",R[1]+"\n")}catch{}
