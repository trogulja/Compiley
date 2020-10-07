# Compiley app db

Database definitions and column explanations.

## days
- **id**: `INTEGER - primary key, unique, not null`
- **year**: `INTEGER` ie: 2020
- **month**: `INTEGER` ie: 9
- **day**: `INTEGER` ie: 24
- **timestamp**: `INTEGER` *(miliseconds as output from javascript date().gettime() func)*
- **sum_images**: `INTEGER` *(sum of all images that were assigned to this day)*
- **sum_users**: `INTEGER` *(sum of distinct users that were assigned to this day)*
- **sum_images_atomic**: `INTEGER` *(sum of all images that we know exact time for this day)*
- **sum_users_atomic**: `INTEGER` *(sum of distinct users that we know had exact time images for this day)*
- **sum_d_working**: `INTEGER` *(sum of duration of working time for this day)*
- **sum_d_presence**: `INTEGER` *(sum of duration of presence time for this day)*

## worktime
- **id**: `INTEGER - primary key, unique, not null - ON CONFLICT IGNORE`
- **days**: `FOREIGN KEY - days.id | del.CASCADE, upd.CASCADE` *(a link to days table)*
- **metaSource**: `FOREIGN KEY - metaSource.id | del.CASCADE, upd.CASCADE` *(a link to metaSource table)*
- **metaUsers**: `FOREIGN KEY - metaUsers.id | del.RESTRICT, upd.CASCADE` *(a link to metaUsers table)*
- **d_presence**: `INTEGER` *(duration for metaUser for that day - check_out time - check_in time, in MS)*
- **d_working**: `INTEGER` *(duration that metaUser has spent working at that day, in MS)*

## jobs
- **id**: `INTEGER - primary key, unique, not null - ON CONFLICT IGNORE`
- **days**: `FOREIGN KEY - days.id | del.CASCADE, upd.CASCADE` *(a link to days table)*
- **metaJobs**: `FOREIGN KEY - metaJobs.id | del.RESTRICT, upd.CASCADE` *(a link to metaJobs table)*
- **metaSource**: `FOREIGN KEY - metaSource.id | del.CASCADE, upd.CASCADE` *(a link to metaSource table)*
- **metaTypes**: `FOREIGN KEY - metaTypes.id | del.RESTRICT, upd.CASCADE` *(a link to metaTypes table)*
- **metaUsers**: `FOREIGN KEY - metaUsers.id | del.RESTRICT, upd.CASCADE` *(a link to metaUsers table)*
- **amount**: `INTEGER`
- **duration**: `INTEGER` *(in MS)*
- **d_type**: `INTEGER - not null, default 0` *(0: read from source, 1: calculated, 2: calculated from average, 3: assumed)*

## jobsAtomic
- **id**: `INTEGER - primary key, unique, not null - ON CONFLICT IGNORE`
- **jobs**: `FOREIGN KEY - jobs.id | del.CASCADE, upd.CASCADE` *(a link to jobs table)*
- **hour**: `INTEGER`
- **minute**: `INTEGER`
- **second**: `INTEGER`
- **duration**: `INTEGER`
- **d_type**: `INTEGER - not null, default 0` *(0: read from source, 1: calculated, 2: calculated from average, 3: assumed)*

## metaJobs - need revision for this table
- **id**: `INTEGER - primary key, unique, not null`
- **country**: `STRING` ie: AT | HR
- **client_group**: `STRING` *(Styria, AdriaMedia or some common identifier like that)*
- **client**: `STRING` *(24h, VL, KLZ, Anzeigen & Marketing Klei (AT), etc... - Kunde in Easyjob)*
- **product_group**: `STRING` *(A way to group similar products - newspaper, magazines, programming - to be determined)*
- **product**: `STRING - unique` *(Produkt in EasyJob, desk in DTI)*
- **metaPrintTypes**: `STRING` *(FOREIGN KEY - metaPrintTypes.id | del.RESTRICT, upd.CASCADE)*

## metaPrintTypes
- **id**: `INTEGER - primary key, unique, not null`
- **type**: `STRING` ie: coldset
- **color_profile**: `STRING` ie: Newspaper Coldset v5

## metaSource
- **id**: `INTEGER - primary key, unique, not null`
- **group**: `STRING` *(descriptor for it, same as metaUsers columns - dti, claro, easyjob, worktime, admin)*
- **name**: `STRING` *(filename or URL of API)*
- **size**: `INTEGER` *(filesize in bytes or null for API)*
- **t_created**: `INTEGER` *(timestamp of file created or null for API in MS)*
- **t_modified**: `INTEGER` *(timestamp of file modified or null for API in MS)*
- **t_parsed**: `INTEGER` *(timestamp when it was ingested)*

## metaTypes
- **id**: `INTEGER - primary key, unique, not null`
- **group**: `STRING` *(job type group, like: images, indesign, web, programming, etc..)*
- **name**: `STRING` *(job type name, like: standard, montage, cutout, etc...)*

## metaUsers
- **id**: `INTEGER - primary key, unique, not null`
- **name**: `STRING` *(username that will be used as default one, like: John Doe)*
- **dti**: `STRING` *(username in DTI)*
- **claro**: `STRING` *(username in Claro)*
- **easyjob**: `STRING` *(username in EasyJob)*
- **worktime**: `STRING` *(username in workingTime)*
- **admin**: `STRING` *(username in admin)*

## helperPrintTypeRegex
- **id**: `INTEGER - primary key, unique, not null`
- **job_name_regex**: `STRING` *(a way to identify new jobs that repeat)*
- **metaPrintTypes**: `FOREIGN KEY - metaPrintTypes.id | del.RESTRICT, upd.CASCADE` *(a link to metaPrintTypes table)*