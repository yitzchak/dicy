beginfig(1)
    pair A, B, C;
    A:=(0,0); B:=(1cm,0); C:=(0,1cm);
    draw A--B--C;
  
endfig;

beginfig(2)
    pair A, B, C;
    A:=(0,0); B:=(1cm,0); C:=(0,1cm);
    draw A--B--C--cycle;
  
endfig;

bye;
