import csv
import os


def main():
    current_dir = os.path.dirname(os.path.abspath(__file__))

    with open(current_dir + '/translations_raw.csv', encoding="utf8") as source_csv:
        reader = csv.reader(source_csv, delimiter=',')

        with open(current_dir + '/translations_dutch.csv', 'w', newline='', encoding="utf8") as dest_csv:
            writer = csv.writer(dest_csv)

            writer.writerow(['Base', 'Basisspel'])
            writer.writerow(['Base, 1E', 'Basisspel, 1E'])
            writer.writerow(['Base, 2E', 'Basisspel, 2E'])
            writer.writerow(['Intrigue, 1E', 'Intrige, 1E'])
            writer.writerow(['Intrigue, 2E', 'Intrige, 2E'])
            writer.writerow(['Promo', 'Promo'])

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

                    # Fix some capitilization
                    elif line[0] == 'Jack of all Trades':
                        line[0] = 'Jack of All Trades'

                    writer.writerow([line[eng_index], line[dutch_index]])


def goto_next_set(reader):
    eof = True
    for line in reader:
        if len(line) == 0:
            continue
        elif line[0] == 'English':
            eof = False
            break

    if eof:
        return None, None

    eng_index = 0
    dutch_index = line.index('Dutch')

    return eng_index, dutch_index


main()
