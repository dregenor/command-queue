import {expect} from "chai";

import {CommandItem, CommandQueue} from "../command-queue"
describe("", ()=>{
    let queue: CommandQueue;
    before(()=>{
        queue = new CommandQueue();
    });
    it("should generate uniq", (finish)=>{
        let {uniq} = queue.push({commandFn:(done)=>{done();}});
        expect(uniq).to.be.a("number");
        queue.once("success", (uniq1)=>{
            expect(uniq1).to.be.eq(uniq);
            queue.removeAllListeners("success");
            finish();
        });
    });

    it("should call b after a is complete", async () => {
        let r = [1];


        queue.push({commandFn:(d)=>{ setTimeout(()=>{ r.push(2); d();}, 1); }});
        queue.push({commandFn:(d)=>{ setTimeout(()=>{ r.push(3); d();}, 10); }});
        queue.push({commandFn:(d)=>{ setTimeout(()=>{ r.push(4); d();}, 20); }});
        queue.push({commandFn:(d)=>{ setTimeout(()=>{ r.push(5); d();}, 30); }});
        queue.push({commandFn:(d)=>{ setTimeout(()=>{ r.push(6); d();}, 100); }});

        let {uniq} = queue.push({commandFn:(d)=>{ r.push(100); d(); }});

        expect(r).to.be.deep.eq([1]);

        await new Promise((resolve)=>{ queue.once(`success${uniq}`, resolve); });
        expect(r).to.be.deep.eq([1,2,3,4,5,6,100]);
    });

    it("should call inserted cb last after a is complete", async () => {
        let r = [1];
        let uniq6;

        queue.push({commandFn:(d)=>{ setTimeout(()=>{ r.push(2); d();}, 1); }});
        queue.push({commandFn:(d)=>{
            setTimeout(()=>{
                r.push(3);
                uniq6 = queue.push({commandFn:(d)=>{ setTimeout(()=>{ r.push(6); d();}, 100); }}).uniq;
                d();
            }, 10);
        }});


        let {uniq} = queue.push({commandFn:(d)=>{ r.push(100); d(); }});

        expect(r).to.be.deep.eq([1]);

        await new Promise((resolve)=>{ queue.once(`success${uniq}`, resolve); });
        expect(r).to.be.deep.eq([1,2,3,100]);
        await new Promise((resolve)=>{ queue.once(`success${uniq6}`, resolve); });
        expect(r).to.be.deep.eq([1,2,3,100,6]);
    });
});