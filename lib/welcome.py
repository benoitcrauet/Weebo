from lib.config import app

def welcome():
    intro_text = '''
              ::::::               
        %-::::::...::::::::        
     **:::.%..............::::     
   @+::::.**..:..:....::@@@..::@   
  *=.--:::=-:.......... @ @:...::  
  @@:----::=..........:::.:..::@:      {name}
    %+:..:...@@@@@@@@@@@@@...::        v{version}
     %+::.:...............::+*     
        @=..:::::::::::..+@            By {author}
        @@@@@@@@@@@@@@@@@@@        
        - =%:         +@           
           @  .-===-    -          
           @*@      @@@            
'''
    
    print(intro_text.format(name=app["name"].upper(), version=app["version"], author=app["author"]))
