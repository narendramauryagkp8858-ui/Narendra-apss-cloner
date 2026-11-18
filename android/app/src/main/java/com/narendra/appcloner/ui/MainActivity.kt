package com.narendra.appcloner.ui

import android.os.Bundle
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.narendra.appcloner.R

/**
 * Narendra App Cloner - Main Dashboard Activity
 * Developer: Narendra Maurya
 */
class MainActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
        Toast.makeText(this, "Narendra App Cloner by Narendra Maurya", Toast.LENGTH_SHORT).show()
    }
}
