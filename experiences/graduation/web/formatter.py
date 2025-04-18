import pandas as pd

df = pd.read_csv( "./data_sorted.csv" )

for i in range(len(df)):
    last_name = df.iloc[i]['Last Name']
    first_name = df.iloc[i]['Preferred First Name']
    degree = df.iloc[i]['Degree']

    print( f"<div id='name_{i}' class='fader'><div class='text2'>{first_name} {last_name}, {degree}</div></div>" )  # in {major}

#    major = df.iloc[i]['Major']
#    img = str( df.iloc[i]['Image'] )

#    if img != "" and img != 'nan':
#        print( f"<div id='name_{i}' class='fader'><div class='text2'>{first_name} {last_name}, {degree}</div><div class='pic' style='background-image:url(\"{img}\")'></div></div>" )  # in {major}
#    else:
