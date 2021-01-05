import csv


def main():
    #with open('translations_raw_test.csv', encoding="utf8") as source_csv:
    with open('translations_raw.csv', encoding="utf8") as source_csv:
        reader = csv.reader(source_csv, delimiter=',')

        with open('translations_dutch.csv', 'w', newline='', encoding="utf8") as dest_csv:
            writer = csv.writer(dest_csv)

            while True:
                # Find languages line
                eng_index, dutch_index = goto_next_set(reader)
                if eng_index is None:
                    break
                
                # Parse one set
                for line in reader:
                    if len(line) == 0 or len(line[0]) == 0 or line[0][0] == '[':
                        break
                    # Skip some bad lines in the raw data
                    elif line[0] == 'Promo' or line[0] == 'Basic cards':
                        continue
                    writer.writerow([line[eng_index], line[dutch_index]])


def goto_next_set(reader):
    eof = True
    for line in reader:
        if len(line) == 0:
            continue
        elif line[0] == 'English':
            eof = False
            break
    
    if eof: return None, None

    eng_index = 0
    dutch_index = line.index('Dutch')

    return eng_index, dutch_index


main()