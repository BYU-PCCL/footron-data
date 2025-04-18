import pandas as pd

df = pd.read_csv( "./data_sorted.csv" )

for i in range(len(df)):
    last_name = df.iloc[i]['Last Name']
    first_name = df.iloc[i]['Preferred First Name']
#    degree = df.iloc[i]['Degree']
#    major = df.iloc[i]['Major']
#    img = str( df.iloc[i]['Image'] )

    print( f"[ {i}, '{first_name} {last_name}' ]," )
