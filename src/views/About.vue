<template>
  <div id="about">
    <article>
      <h1>About Me</h1>

      <p>
        Hi! My name is Tin, but I also go by Caellian online.
        I'm a programming language enthusiast and spend most of my free time
        working on projects I find interesting at the time.
      </p>

      <p>
        I'm a student at University in Rijeka. I'm studying Information
        Technologies. I learned most of what I now know about programming by
        testing out different language environments in my free time and
        searching which ones provide features I'd like provided in the current one.
      </p>
    </article>

    <article>
      <h1>Employment</h1>

      <h2>Permanent Jobs</h2>
      <p>
        I'm looking for a permanent job position. If you think your company
        could use a kick-ass software developer feel welcome to contact me.
      </p>

      <p>
        I have experience working and interacting with people in business
        environments as well as collaborating with groups of people on larger
        projects.
      </p>

      <p>
        Languages I have enough experience to feel comfortable working in are
        C++, JVM languages (Kotlin, Java, Groovy, Scala), JavaScript,
        TypeScript and Python. I have some experience in a lot of other
        programming languages but I'm not fully familiar with their standard
        libraries and they would take me a week or two to get into.
      </p>

      <div class="hor-list">
        <!-- TODO: Translate the CV to English -->
        <a
          class="button"
          href="https://s3.eu-central-1.amazonaws.com/caellian.net/CV/cv-en.pdf"
        >Download CV</a>
      </div>

      <h2>Freelancing</h2>

      <p>
        I'm open for Freelancing jobs in Java and Web Development. I have
        experience with Freelancing already and would gladly help you bring your
        ideas to life.
      </p>
    </article>

    <article>
      <h1>My Journey into Software Development</h1>

      <p>
        I started experimenting with code by writing user interfaces for small
        widgets in Visual Basic when I was 9 years old.
      </p>

      <p>
        I competed in Croatian programming contests with LOGO in middle school.
        I also wrote my first text based game in QuickBasic back then.
      </p>

      <p>
        Around the end of middle school I started playing Minecraft and got into
        writing mods in Java which lead me to picking up on programming
        conventions, maven project structure, test driven development,
        functional programming and writing APIs for other developers to consume.
      </p>

      <p>
        High School was the period when I started learning C and C++, programming
        for Arduino boards. Outside of programming I also learned how logic
        gates work, circuit boards and electricity work as well as becomming
        a radio amateur (although I don't enjoy it as much nowadays).
        I also competed in programming contests using C and later C++.
      </p>

      <p>
        Betweed my first and second year of study at University of Rijeka, I
        fell in love with C++ and realised how powerfull it's templating system
        is. I also started with metaprogramming which made me like it even more.
        This is when I'd say I actually really learned C++ because I started
        seriously looking at STL and differences between standard versions as
        well as exploring C++20 and
        <a
          href="https://en.cppreference.com/w/cpp/language/constraints"
        >concepts</a>.
      </p>
    </article>

    <article>
      <h1>Personal Projects</h1>

      <p>
        My personal projects change very often as my interests shift. I don't
        force myself to finish most of them as they are the way I like learning
        new things.
      </p>

      <p>
        This is great when it comes to learning how different languages and
        libraries work but often leaves me with little to show on my resume.
        Employers tend to perceive it as a bad thing which is why I keep most of
        my work private unless I plan on actively working on it and developing
        certain projects further in which case I release it on GitHub.
      </p>

      <p>
        I'm currently actively working on a Java decompiler (and in good time
        deobfuscator) in C++. Apart from that, I'm also privately writing a 3D
        game engine as I want to learn how to use Vulkan and how to write game
        shaders from scratch.
      </p>

      <p>
        If you want to read more about my personal projects, feel free to
        to check out the
        <router-link to="/projects">projects page</router-link> or my
        <a href="https://github.com/Caellian">GitHub profile</a>.
      </p>
      
      <h2>Freedom of Software</h2>

      <p>
        I'm a big believer in open source software. If done properly, it allows
        the community to work with the developers on projects they love.
      </p>

      <p>
        Main proponing argument is that it disallows comercial use of software.
        It does not. Qt is a prime example of that. Even something like
        Aseprite prooves this argument faulty. Not many people know how to
        compile programs on their own and these days people usually pay for
        services, not software itself.
      </p>

      <p>I love contributing to open source projects where I can.</p>
    </article>
  </div>
</template>

<script lang="ts">
export default {
  name: "about"
};
</script>

<style scoped lang="scss"></style>
