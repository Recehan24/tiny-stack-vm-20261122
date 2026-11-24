# tiny-stack-vm-20261122

One small TypeScript program that runs make.fun's tiny stack ISA: it answers
every instance in `/input` with `/output/<id>/stdout.bin` and `exit.txt`,
following the reference semantics exactly — wrapping 32-bit arithmetic, the
unsigned DIVU/MODU/LTU, masked shift counts, and each trap's own exit code.

A make.fun bounty entry: https://make.fun/bounty/tiny-stack-vm-01-run-20261122
