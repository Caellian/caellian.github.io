var e={active:[{id:"java_decompiler",name:"Java Decompiler",tags:["JVM","Rust"],lang:"Rust",url:"https://github.com/Caellian/java-decompiler",description:["Java decompiler written from scratch to be as performant as possible with large .jar files.","What I initially wanted to write is a deobfuscator, but bytecode contains additional information which removes the need for parsing code and assembling AST.","There is also no decompiler for some other JVM languages so I plan gradually supporting them as this project progresses."]},{id:"zipster",name:"zipster",tags:["zip","data management","Rust","C"],lang:"Rust",description:["Zip format reader I started writing due to requirements of my decompiler project.","It's written in Rust, and has headers for C so that it can be used in C/C++ land.","This is meant to be an alternative to zip library that supports file iterators and is more actively maintained."]},{id:"voxel_engine",name:"Voxel Engine",tags:["rendering","vulkan","lua scripting","Rust"],lang:"Rust",description:["Vulkan voxel game engine focused on dynamic and procedurally generated content.",'I love writing game logic and this scratches that itch when I don\'t feel like doing anything "productive"',"It also allows me to explore different rendering techniques, SPIR-V, low level rendering, data management, ...","I plan on releasing it under MIT License once it's functional."]}],previous:[{id:"math",name:"Math",tags:["finished","math","rendering","matrix","transformations"],lang:"Kotlin",url:"https://github.com/Caellian/Math",description:["Library for n-dimensional vector and matrix calculation.","Math library has everything glm for C++ has, with some additional methods for easier dealing with linear algebra.","It's made for Kotlin but works just as well with Java and is practical in both languages due to many utility functions.","This library was first written in Scala and then ported to Kotlin to make it easier to use from pure Java."]},{id:"arg_lib",name:"ArgLib",tags:["finished","data management"],lang:"Kotlin",url:"https://github.com/Caellian/ArgLib",description:["Argument parsing/handling library with primary focus on simplicity of configuration.","I wrote it for some of my simpler apps that would've been overbloated by some of the more stable and bigger argument parsers."]},{id:"note_stream",name:"NoteStream",tags:["abandoned","android","services","SQLite"],lang:"Kotlin",url:"https://github.com/Caellian/NoteStream",description:["Android application for streaming YouTube and playing local music.","NoteStream supports creating mixed playlists, downloading individual songs from YouTube as well as entire playlists and much more.","It was what I initailly used to get into Android developement and learn about SQLite."]},{id:"paradox_generator",name:"ParadoxGenerator",tags:["finished","gui","swing","xml"],lang:"Java",url:"https://github.com/Caellian/ParadoxGenerator",description:["Random string generator completely configurable through XML, supporting templates, internal functions and localization.","It contains a lot of different internal random string, number, format, date generators."]},{id:"flow_api",name:"FlowAPI",tags:["finished","data management","abstraction"],lang:"Java",url:"https://github.com/Caellian/FlowAPI",description:["API for managing flow of abstract packets of abstract data in a node network.","It was originally designed as a Minecraft power API but it helps with transfer of any form of data structured as packets containing interface defined properties","It also helps with handling object conversion and supplies several useful classes which make collaboration much easier."]},{id:"kson",name:"Kson",tags:["finished","json"],lang:"Kotlin",url:"https://github.com/Caellian/Kson",description:["Library simplifying JSON serialization and deserialization of Kotlin objects (singleton classes).","It doesn't do very much, I wrote it so I don't have to copy and paste code for loading program configuration files."]},{id:"crawler",name:"Crawler",tags:["finished","beatiful soup","regex","phantom-js"],lang:"Python",url:"https://github.com/Caellian/Crawler",description:["Web regex search engine/crawler.","It allows specifying regex to be searched for on different websites, specifying search query, and returns a list of matches.","It uses PhantomJS which is a headless V8 implementation to acquire results from Google as well as other search engines such as Bing and DuckDuckGo."]},{id:"smart_flood_fill",name:"SmartFloodFill MCEdit Filter",tags:["finished","discontinued","bfs","mcedit","minecraft"],lang:"Python",url:"https://github.com/Caellian/MCEdit-Filters",description:["Flood fill filter for MCEdit (Minecraft map editor) taking into account blocks sharing sides or edges (configurable).","I used this project to learn writing MCEdit filters."]},{id:"bow_engine",name:"Bow Engine",tags:["rendering","basic"],lang:"Java",url:"https://github.com/Caellian/BowEngine",description:["A standard LWJGL2 OpenGL rendering engine with very primitive shading.","This was the first game engine I wrote, it was painfuly slow due to my lack of experience and knowledge with rendering back then.","I even intended on using annotations for runtime physics handling which was... not very thought out. My head feels better now."]}],forks:[{id:"review_heatmap",name:"review-heatmap",tags:["productivity","learning"],lang:"Python",url:"https://github.com/Caellian/review-heatmap",description:["Dark themed review heatmap for Anki.","Fork of original review-heatmap customised to look neat with dark theme."]},{id:"feh",name:"feh",tags:["json"],lang:"C",url:"https://github.com/Caellian/feh",description:["feh is an image viewer.","Modified version of feh with added support for JSON configuration files.","I was asked by a teacher in my secondary school to add support for specifying custom image display times (images with text should be displayed longer) so I added support for this through configuration files."]},{id:"enigma",name:"Enigma",tags:["swing","code manipulation"],lang:"Java",url:"https://github.com/Caellian/Enigma",description:["Enigma is a tool for deobfuscation of Java bytecode.","I added some gui components and menus that made my work a lot easier later."]}]};export{e as p};
