# Compiley
Compile data from multiple sources to produce work report

# Todo list
- [x] getMeta - get known tables
  - [x] metaUsers(source): { source: id } mapping
  - [x] metaJobs: { product: id } mapping
  - [x] metaTypes: { name: id } mapping
- [x] get list of files we need to process
  - [ ] add file name checker - they need to be unique
    - [ ] add first folder checker - needs to follow a pattern (to be defined)
  - [x] get created, modified timestamp, set current timestamp
  - [x] match filename with known source list
    - [x] file created lower, modified higher - check & replace
      - [ ] figure out some type of check for this
    - [x] file created equal or higher, modified higher - replace
    - [x] what to do if we have more than one same filename as source?
      - [x] first folder within data (so, data/something) should be captured and added to name (data-18-01/file.xls)
- [ ] parseDTI
  - [x] handle meta vs db sate
    - [x] drop source from db if it's already known source (cascade drop for related entries)
    - [x] check if known user (set John Doe for unkowns), get id
      -  [ ] better handling for unknown users
    - [x] check if known job (if not: add to db, update metaJobs), get id
    - [x] check if known type (if not: throw an error, should be defined upfront), get id
    - [x] check if known day (if not: add to db), get id
  - [x] handle standard images
    - [x] set d_type 4 in first go (will be read from claro logs or assumed)
  - [x] handle automatic images
    - [x] set d_type 4 in first go (will be read from claro logs or assumed)
  - [x] handle cutout images
    - [x] solve duration for cutout images
    - [x] d_type = 0 (read from source)
  - [x] end of file db housekeeping
    - [x] reduce jobsAtomic by day / job / source / type / user into job
    - [x] insert new jobs, get id
    - [x] update jobsAtomic with valid id, insert into db
- [ ] parseClaro
  - [ ] new source with date constraint
  - [ ] write results to helperClaro (or make new table just for claro?)
  - [ ]
- [ ] db housekeeping (at the batch end)
  - [ ] helperClaro
    - [ ] match claro with dti standard
      - [ ] update matched jobsAtomic
    - [ ] match claro with dti automatic
      - [ ] update matched jobsAtomic
    - [ ] match claro with klz inspector (halbauto / standard)
      - [ ] insert into jobsAtomic
    - [ ] insert claro klz automatic into jobsAtomic
    - [ ] insert claro klz elvis into jobsAtomic
    - [ ] match claro others into jobsAtomic
  - [ ] for each new day added or updated
    - [ ] sum_images
  - [ ] for each jobs.d_type > 1
  - [ ] for each jobsAtomic.d_type > 1
